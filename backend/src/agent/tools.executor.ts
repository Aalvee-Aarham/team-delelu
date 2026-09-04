import { Schedule } from "../models/schedule.model";
import { Room } from "../models/room.model";
import { Booking } from "../models/booking.model";
import { Event } from "../models/event.model";
import { Announcement } from "../models/announcement.model";
import { Assignment } from "../models/assignment.model";
import { Course } from "../models/course.model";
import { Submission } from "../models/submission.model";
import { AuthPayload } from "../middleware/auth";
import { TOOLS_BY_NAME } from "./tools.schema";
import { findAvailableRooms, findRoomConflict, attachBookings, timesOverlap } from "../services/rooms.service";
import { computeAnalytics } from "../services/analytics.service";
import { publishChange } from "../realtime/sse";

const CAMPUS_DAY_START = "08:00";
const CAMPUS_DAY_END = "18:00";

function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function toTime(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

function freeWindows(busy: { start_time: string; end_time: string }[], minDurationMinutes: number) {
  const merged = busy
    .map((b) => [toMinutes(b.start_time), toMinutes(b.end_time)] as const)
    .sort((a, b) => a[0] - b[0])
    .reduce<[number, number][]>((acc, [start, end]) => {
      const last = acc[acc.length - 1];
      if (last && start <= last[1]) {
        last[1] = Math.max(last[1], end);
      } else {
        acc.push([start, end]);
      }
      return acc;
    }, []);

  const windows: { start_time: string; end_time: string }[] = [];
  let cursor = toMinutes(CAMPUS_DAY_START);
  const dayEnd = toMinutes(CAMPUS_DAY_END);
  for (const [start, end] of merged) {
    if (start - cursor >= minDurationMinutes) windows.push({ start_time: toTime(cursor), end_time: toTime(start) });
    cursor = Math.max(cursor, end);
  }
  if (dayEnd - cursor >= minDurationMinutes) windows.push({ start_time: toTime(cursor), end_time: toTime(dayEnd) });
  return windows;
}

export interface Provenance {
  collection: string;
  id: string;
}

export interface ToolResult {
  ok: boolean;
  data: unknown;
  provenance: Provenance[];
}

const PROJECTION = {
  schedule: { _id: 0, id: 1, course: 1, title: 1, day: 1, start_time: 1, end_time: 1, room: 1, instructor: 1, section: 1 },
  assignment: { _id: 0, id: 1, course: 1, title: 1, deadline: 1, status: 1, marks: 1, submission_platform: 1 },
  announcement: { _id: 0, id: 1, title: 1, body: 1, date: 1, priority: 1, posted_by: 1, expires: 1 },
  event: { _id: 0, id: 1, name: 1, description: 1, date: 1, end_date: 1, start_time: 1, end_time: 1, venue: 1, organizer: 1, capacity: 1, registered: 1, status: 1 },
  course: { _id: 0, id: 1, code: 1, title: 1, instructor: 1, section: 1, room: 1, term: 1 },
  submission: { _id: 0, id: 1, assignment_id: 1, assignment_title: 1, course_code: 1, student_id: 1, student_name: 1, status: 1, grade: 1, late: 1, submitted_at: 1, feedback: 1 },
} as const;

function truncate(text: string, max = 160): string {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

function prov(collection: string, docs: { id: string }[]): Provenance[] {
  return docs.map((d) => ({ collection, id: d.id }));
}

async function resolveEvent(ref: string) {
  const byId = await Event.findOne({ id: ref });
  if (byId) return byId;
  return Event.findOne({ name: { $regex: ref.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } });
}

export async function executeTool(name: string, rawArgs: unknown, auth: AuthPayload): Promise<ToolResult> {
  const def = TOOLS_BY_NAME.get(name);
  if (!def) {
    return { ok: false, data: { error: `Unknown tool: ${name}` }, provenance: [] };
  }

  if (def.adminOnly && auth.role !== "admin") {
    return {
      ok: false,
      data: {
        error: "permission_denied",
        message: `The '${name}' action requires an admin role. You are signed in as a student, so this change was not made. Tell the user plainly that they are not authorised to do this and suggest contacting the department or an admin.`,
      },
      provenance: [],
    };
  }

  const parsed = def.args.safeParse(rawArgs ?? {});
  if (!parsed.success) {
    return {
      ok: false,
      data: { error: "invalid_arguments", message: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") },
      provenance: [],
    };
  }
  const args = parsed.data as Record<string, never>;

  switch (name) {
    case "get_schedule": {
      const filter: Record<string, unknown> = {};
      if (args.day) filter.day = args.day;
      if (args.course) filter.course = { $regex: args.course, $options: "i" };
      if (args.section) filter.section = args.section;
      const docs = await Schedule.find(filter, PROJECTION.schedule).sort({ day: 1, start_time: 1 }).lean();
      return { ok: true, data: docs, provenance: prov("schedules", docs) };
    }

    case "get_assignments": {
      const filter: Record<string, unknown> = {};
      if (args.status) filter.status = args.status;
      if (args.course) filter.course = { $regex: args.course, $options: "i" };
      if (args.due_before) filter.deadline = { $lte: args.due_before };
      const docs = await Assignment.find(filter, PROJECTION.assignment).sort({ deadline: 1 }).lean();
      return { ok: true, data: docs, provenance: prov("assignments", docs) };
    }

    case "get_courses": {
      const filter: Record<string, unknown> = {};
      if (args.code) filter.code = { $regex: args.code, $options: "i" };
      const docs = await Course.find(filter, PROJECTION.course).sort({ code: 1 }).lean();
      return { ok: true, data: docs, provenance: prov("courses", docs) };
    }

    case "get_submissions": {
      const filter: Record<string, unknown> =
        auth.role === "admin" ? {} : { student_id: auth.student_id };
      if (args.assignment_id) filter.assignment_id = args.assignment_id;
      if (args.course) filter.course_code = { $regex: args.course, $options: "i" };
      if (args.status) filter.status = args.status;
      const docs = await Submission.find(filter, PROJECTION.submission)
        .sort({ submitted_at: -1 })
        .limit(40)
        .lean();
      return { ok: true, data: docs, provenance: prov("submissions", docs) };
    }

    case "get_announcements": {
      const filter: Record<string, unknown> = {};
      if (args.priority) filter.priority = args.priority;
      if (args.active_only) filter.expires = { $gte: new Date().toISOString().slice(0, 10) };
      const docs = await Announcement.find(filter, PROJECTION.announcement).sort({ date: -1 }).lean();
      return { ok: true, data: docs, provenance: prov("announcements", docs) };
    }

    case "get_events": {
      const filter: Record<string, unknown> = {};
      if (args.status) filter.status = args.status;
      if (args.date) filter.date = args.date;
      const docs = await Event.find(filter, PROJECTION.event).sort({ date: 1 }).lean();
      const slim = docs.map((d) => ({ ...d, description: truncate(d.description) }));
      return { ok: true, data: slim, provenance: prov("events", docs) };
    }

    case "get_rooms": {
      const filter: Record<string, unknown> = {};
      if (args.type) filter.type = args.type;
      if (args.min_capacity) filter.capacity = { $gte: args.min_capacity };
      if (args.equipment && (args.equipment as string[]).length > 0) filter.equipment = { $all: args.equipment };
      const docs = await Room.find(filter).sort({ room_number: 1 });
      const withBookings = await attachBookings(docs);
      const slim = withBookings.map((r) => ({
        room_number: r.room_number,
        type: r.type,
        capacity: r.capacity,
        equipment: r.equipment,
        status: r.status,
        bookings: r.bookings,
      }));
      return { ok: true, data: slim, provenance: prov("rooms", docs) };
    }

    case "find_available_rooms": {
      const result = await findAvailableRooms({
        date: args.date,
        start_time: args.start_time,
        end_time: args.end_time,
        min_capacity: args.min_capacity,
        equipment: args.equipment,
      });
      return {
        ok: true,
        data: {
          available: result.available.map((r) => ({
            room_number: r.room_number,
            type: r.type,
            capacity: r.capacity,
            equipment: r.equipment,
          })),
          busy: result.conflicts.map((c) => ({ room_number: c.room_number, reason: c.reason.detail })),
        },
        provenance: prov("rooms", result.available),
      };
    }

    case "find_common_free_slot": {
      const minDuration = args.min_duration_minutes ?? 30;
      const classes = await Schedule.find({ day: args.day, section: { $in: args.sections } });
      const windows = freeWindows(classes, minDuration);
      if (windows.length === 0) {
        return {
          ok: true,
          data: { windows: [], message: "No common free window found that day for those sections." },
          provenance: prov("schedules", classes),
        };
      }
      const withRooms = await Promise.all(
        windows.map(async (w) => {
          const result = await findAvailableRooms({ date: args.date, start_time: w.start_time, end_time: w.end_time });
          return {
            ...w,
            suggested_rooms: result.available.slice(0, 5).map((r) => ({ room_number: r.room_number, capacity: r.capacity, equipment: r.equipment })),
          };
        })
      );
      return { ok: true, data: { windows: withRooms }, provenance: prov("schedules", classes) };
    }

    case "get_campus_analytics": {
      const data = await computeAnalytics(args.date);
      const [rooms, assignments, events, schedules] = await Promise.all([
        Room.find({}, { _id: 0, id: 1 }).lean(),
        Assignment.find({}, { _id: 0, id: 1 }).lean(),
        Event.find({}, { _id: 0, id: 1 }).lean(),
        Schedule.find({}, { _id: 0, id: 1 }).lean(),
      ]);
      return {
        ok: true,
        data,
        provenance: [...prov("rooms", rooms), ...prov("assignments", assignments), ...prov("events", events), ...prov("schedules", schedules)],
      };
    }

    case "book_room": {
      if (args.start_time >= args.end_time) {
        return { ok: false, data: { error: "invalid_time_range", message: "start_time must be before end_time" }, provenance: [] };
      }
      const room = await Room.findOne({ room_number: args.room_number });
      if (!room) {
        return { ok: false, data: { error: "not_found", message: `No room numbered ${args.room_number}` }, provenance: [] };
      }
      if (room.status === "unavailable") {
        return { ok: false, data: { error: "room_unavailable", message: `Room ${room.room_number} is marked unavailable` }, provenance: [] };
      }
      const conflict = await findRoomConflict(room.room_number, args.date, args.start_time, args.end_time);
      if (conflict) {
        return {
          ok: false,
          data: { error: "conflict", message: `Room ${room.room_number} is not free then. ${conflict.detail}` },
          provenance: [{ collection: "rooms", id: room.id }],
        };
      }
      const booking = await Booking.create({
        booking_id: `bk-${Date.now().toString(36)}`,
        room_number: room.room_number,
        booked_by: auth.userId,
        booked_by_name: auth.name,
        date: args.date,
        start_time: args.start_time,
        end_time: args.end_time,
        purpose: args.purpose || `Booked by ${auth.name} via CampusOS`,
      });
      publishChange("rooms", "update", room.id);
      return { ok: true, data: booking, provenance: [{ collection: "rooms", id: room.id }] };
    }

    case "cancel_booking": {
      const booking = await Booking.findOne({ booking_id: args.booking_id });
      if (!booking) {
        return { ok: false, data: { error: "not_found", message: `No booking ${args.booking_id}` }, provenance: [] };
      }
      if (auth.role !== "admin" && booking.booked_by !== auth.userId) {
        return {
          ok: false,
          data: {
            error: "permission_denied",
            message: `That booking belongs to ${booking.booked_by_name}, not the current user. Refuse and explain that a student can only cancel their own bookings.`,
          },
          provenance: [],
        };
      }
      await booking.deleteOne();
      const room = await Room.findOne({ room_number: booking.room_number });
      if (room) publishChange("rooms", "update", room.id);
      return { ok: true, data: { cancelled: args.booking_id }, provenance: room ? [{ collection: "rooms", id: room.id }] : [] };
    }

    case "get_my_bookings": {
      const docs = await Booking.find({ booked_by: auth.userId }).sort({ date: 1 });
      return { ok: true, data: docs, provenance: [] };
    }

    case "register_for_event": {
      const event = await resolveEvent(args.event);
      if (!event) {
        return { ok: false, data: { error: "not_found", message: `No event matching '${args.event}'` }, provenance: [] };
      }
      if (event.registrations.some((r) => r.student_id === auth.student_id)) {
        return { ok: false, data: { error: "already_registered", message: `Already registered for ${event.name}` }, provenance: [{ collection: "events", id: event.id }] };
      }
      if (event.registered >= event.capacity) {
        return { ok: false, data: { error: "full", message: `${event.name} is full (${event.registered}/${event.capacity})` }, provenance: [{ collection: "events", id: event.id }] };
      }
      event.registrations.push({ student_id: auth.student_id, name: auth.name });
      event.registered += 1;
      if (event.registered >= event.capacity) event.status = "full";
      await event.save();
      publishChange("events", "update", event.id);
      return { ok: true, data: { registered: event.name, spots_left: event.capacity - event.registered }, provenance: [{ collection: "events", id: event.id }] };
    }

    case "cancel_registration": {
      const event = await resolveEvent(args.event);
      if (!event) {
        return { ok: false, data: { error: "not_found", message: `No event matching '${args.event}'` }, provenance: [] };
      }
      const idx = event.registrations.findIndex((r) => r.student_id === auth.student_id);
      if (idx === -1) {
        return { ok: false, data: { error: "not_registered", message: `Not registered for ${event.name}` }, provenance: [{ collection: "events", id: event.id }] };
      }
      event.registrations.splice(idx, 1);
      event.registered = Math.max(0, event.registered - 1);
      if (event.status === "full" && event.registered < event.capacity) event.status = "upcoming";
      await event.save();
      publishChange("events", "update", event.id);
      return { ok: true, data: { cancelled: event.name }, provenance: [{ collection: "events", id: event.id }] };
    }

    case "create_announcement": {
      const id = `ann-${Date.now().toString(36)}`;
      const doc = await Announcement.create({
        id,
        title: args.title,
        body: args.body,
        date: new Date().toISOString().slice(0, 10),
        priority: args.priority,
        posted_by: auth.name,
        expires: args.expires,
      });
      publishChange("announcements", "create", id);
      return { ok: true, data: doc, provenance: [{ collection: "announcements", id }] };
    }

    case "update_announcement": {
      const update: Record<string, unknown> = {};
      if (args.title) update.title = args.title;
      if (args.body) update.body = args.body;
      if (args.priority) update.priority = args.priority;
      const doc = await Announcement.findOneAndUpdate({ id: args.id }, update, { new: true });
      if (!doc) return { ok: false, data: { error: "not_found", message: `No announcement ${args.id}` }, provenance: [] };
      publishChange("announcements", "update", args.id);
      return { ok: true, data: doc, provenance: [{ collection: "announcements", id: args.id }] };
    }

    case "delete_announcement": {
      const doc = await Announcement.findOneAndDelete({ id: args.id });
      if (!doc) return { ok: false, data: { error: "not_found", message: `No announcement ${args.id}` }, provenance: [] };
      publishChange("announcements", "delete", args.id);
      return { ok: true, data: { deleted: args.id }, provenance: [] };
    }

    case "update_schedule": {
      const update: Record<string, unknown> = {};
      for (const key of ["room", "start_time", "end_time", "day"] as const) {
        if (args[key]) update[key] = args[key];
      }
      const doc = await Schedule.findOneAndUpdate({ id: args.id }, update, { new: true });
      if (!doc) return { ok: false, data: { error: "not_found", message: `No schedule ${args.id}` }, provenance: [] };
      publishChange("schedules", "update", args.id);
      return { ok: true, data: doc, provenance: [{ collection: "schedules", id: args.id }] };
    }

    case "delete_schedule": {
      const doc = await Schedule.findOneAndDelete({ id: args.id });
      if (!doc) return { ok: false, data: { error: "not_found", message: `No schedule ${args.id}` }, provenance: [] };
      publishChange("schedules", "delete", args.id);
      return { ok: true, data: { deleted: args.id }, provenance: [] };
    }

    case "create_schedule": {
      if (args.start_time >= args.end_time) {
        return { ok: false, data: { error: "invalid_time_range", message: "start_time must be before end_time" }, provenance: [] };
      }
      const clashes = await Schedule.find({ room: args.room, day: args.day });
      const clash = clashes.find((c) => timesOverlap(args.start_time, args.end_time, c.start_time, c.end_time));
      if (clash) {
        return {
          ok: false,
          data: { error: "conflict", message: `Room ${args.room} already has ${clash.course} (${clash.title}) on ${args.day} ${clash.start_time}-${clash.end_time}` },
          provenance: [{ collection: "schedules", id: clash.id }],
        };
      }
      const id = `sch-${Date.now().toString(36)}`;
      const doc = await Schedule.create({ id, ...args });
      publishChange("schedules", "create", id);
      return { ok: true, data: doc, provenance: [{ collection: "schedules", id }] };
    }

    case "create_room": {
      const existing = await Room.findOne({ room_number: args.room_number });
      if (existing) {
        return { ok: false, data: { error: "conflict", message: `Room ${args.room_number} already exists` }, provenance: [{ collection: "rooms", id: existing.id }] };
      }
      const id = `room-${Date.now().toString(36)}`;
      const doc = await Room.create({ id, room_number: args.room_number, type: args.type, capacity: args.capacity, equipment: args.equipment ?? [], floor: args.floor });
      publishChange("rooms", "create", id);
      return { ok: true, data: doc, provenance: [{ collection: "rooms", id }] };
    }

    case "update_room": {
      const update: Record<string, unknown> = {};
      for (const key of ["type", "capacity", "equipment", "floor", "status"] as const) {
        if (args[key] !== undefined) update[key] = args[key];
      }
      const doc = await Room.findOneAndUpdate({ room_number: args.room_number }, update, { new: true });
      if (!doc) return { ok: false, data: { error: "not_found", message: `No room ${args.room_number}` }, provenance: [] };
      publishChange("rooms", "update", doc.id);
      return { ok: true, data: doc, provenance: [{ collection: "rooms", id: doc.id }] };
    }

    case "delete_room": {
      const doc = await Room.findOneAndDelete({ room_number: args.room_number });
      if (!doc) return { ok: false, data: { error: "not_found", message: `No room ${args.room_number}` }, provenance: [] };
      publishChange("rooms", "delete", doc.id);
      return { ok: true, data: { deleted: args.room_number }, provenance: [] };
    }

    case "create_event": {
      const id = `evt-${Date.now().toString(36)}`;
      const doc = await Event.create({ id, ...args, registered: 0, registrations: [], status: "upcoming" });
      publishChange("events", "create", id);
      return { ok: true, data: doc, provenance: [{ collection: "events", id }] };
    }

    case "update_event": {
      const update: Record<string, unknown> = {};
      for (const key of ["name", "description", "date", "start_time", "end_time", "venue", "capacity", "status"] as const) {
        if (args[key] !== undefined) update[key] = args[key];
      }
      const doc = await Event.findOneAndUpdate({ id: args.id }, update, { new: true });
      if (!doc) return { ok: false, data: { error: "not_found", message: `No event ${args.id}` }, provenance: [] };
      publishChange("events", "update", args.id);
      return { ok: true, data: doc, provenance: [{ collection: "events", id: args.id }] };
    }

    case "delete_event": {
      const doc = await Event.findOneAndDelete({ id: args.id });
      if (!doc) return { ok: false, data: { error: "not_found", message: `No event ${args.id}` }, provenance: [] };
      publishChange("events", "delete", args.id);
      return { ok: true, data: { deleted: args.id }, provenance: [] };
    }

    case "create_assignment": {
      const id = `asg-${Date.now().toString(36)}`;
      const doc = await Assignment.create({ id, ...args, status: "pending" });
      publishChange("assignments", "create", id);
      return { ok: true, data: doc, provenance: [{ collection: "assignments", id }] };
    }

    case "update_assignment": {
      const update: Record<string, unknown> = {};
      for (const key of ["title", "description", "deadline", "status", "marks"] as const) {
        if (args[key] !== undefined) update[key] = args[key];
      }
      const doc = await Assignment.findOneAndUpdate({ id: args.id }, update, { new: true });
      if (!doc) return { ok: false, data: { error: "not_found", message: `No assignment ${args.id}` }, provenance: [] };
      publishChange("assignments", "update", args.id);
      return { ok: true, data: doc, provenance: [{ collection: "assignments", id: args.id }] };
    }

    case "delete_assignment": {
      const doc = await Assignment.findOneAndDelete({ id: args.id });
      if (!doc) return { ok: false, data: { error: "not_found", message: `No assignment ${args.id}` }, provenance: [] };
      publishChange("assignments", "delete", args.id);
      return { ok: true, data: { deleted: args.id }, provenance: [] };
    }

    case "bulk_reschedule_instructor": {
      const matches = await Schedule.find({
        instructor: { $regex: args.instructor, $options: "i" },
        ...(args.day ? { day: args.day } : {}),
      });
      if (matches.length === 0) {
        return { ok: false, data: { error: "not_found", message: `No classes found for instructor matching '${args.instructor}'` }, provenance: [] };
      }
      const shift = (time: string) => {
        const [h, m] = time.split(":").map(Number);
        const total = ((h * 60 + m + args.delta_minutes) % 1440 + 1440) % 1440;
        return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
      };
      const preview = matches.map((c) => ({
        id: c.id,
        course: c.course,
        day: c.day,
        from: `${c.start_time}-${c.end_time}`,
        to: `${shift(c.start_time)}-${shift(c.end_time)}`,
      }));
      if (!args.confirm) {
        return {
          ok: true,
          data: { preview: true, message: "Nothing written yet. Show this preview to the user and call again with confirm=true only after they explicitly agree.", affected: preview },
          provenance: prov("schedules", matches),
        };
      }
      for (const c of matches) {
        c.start_time = shift(c.start_time);
        c.end_time = shift(c.end_time);
        await c.save();
        publishChange("schedules", "update", c.id);
      }
      return { ok: true, data: { rescheduled: preview }, provenance: prov("schedules", matches) };
    }

    case "bulk_clear_expired_announcements": {
      const cutoff = args.before_date || new Date().toISOString().slice(0, 10);
      const matches = await Announcement.find({ expires: { $lt: cutoff } });
      if (matches.length === 0) {
        return { ok: true, data: { preview: !args.confirm, message: "No expired announcements found.", affected: [] }, provenance: [] };
      }
      const preview = matches.map((a) => ({ id: a.id, title: a.title, expires: a.expires }));
      if (!args.confirm) {
        return {
          ok: true,
          data: { preview: true, message: "Nothing deleted yet. Show this preview to the user and call again with confirm=true only after they explicitly agree.", affected: preview },
          provenance: prov("announcements", matches),
        };
      }
      const ids = matches.map((a) => a.id);
      await Announcement.deleteMany({ id: { $in: ids } });
      for (const id of ids) publishChange("announcements", "delete", id);
      return { ok: true, data: { deleted: preview }, provenance: [] };
    }

    default:
      return { ok: false, data: { error: `Unhandled tool: ${name}` }, provenance: [] };
  }
}
