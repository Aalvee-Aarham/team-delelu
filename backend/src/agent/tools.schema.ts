import { z } from "zod";

export interface ToolDef {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  args: z.ZodTypeAny;
  adminOnly: boolean;
}

const obj = (properties: Record<string, unknown>, required: string[] = []) => ({
  type: "object",
  properties,
  required,
});

const str = (description: string) => ({ type: "string", description });
const num = (description: string) => ({ type: "number", description });

export const TOOLS: ToolDef[] = [
  {
    name: "get_schedule",
    description:
      "Read the class timetable. Filter by day, course code, or section. Omit all filters to get the full week. Use this for any question about classes, lectures, labs, when or where a class meets, or what the user has on a given day.",
    parameters: obj({
      day: str("Day of week: Sunday, Monday, Tuesday, Wednesday or Thursday"),
      course: str("Course code, e.g. 'CSE 4113'"),
      section: str("Section label, e.g. 'B'"),
    }),
    args: z.object({ day: z.string().optional(), course: z.string().optional(), section: z.string().optional() }),
    adminOnly: false,
  },
  {
    name: "get_assignments",
    description:
      "Read assignments. Filter by status, course, or a deadline cutoff. Use due_before with an ISO date to answer questions like 'what is due this week'.",
    parameters: obj({
      status: str("pending, submitted, graded or late"),
      course: str("Course code"),
      due_before: str("ISO date YYYY-MM-DD; returns assignments due on or before this date"),
    }),
    args: z.object({ status: z.string().optional(), course: z.string().optional(), due_before: z.string().optional() }),
    adminOnly: false,
  },
  {
    name: "get_announcements",
    description:
      "Read campus announcements and notices. Filter by priority, or set active_only to exclude expired notices. Always check here when a user asks whether something changed, moved, or was cancelled.",
    parameters: obj({
      priority: str("high, medium or low"),
      active_only: { type: "boolean", description: "Exclude announcements whose expiry date has passed" },
    }),
    args: z.object({ priority: z.string().optional(), active_only: z.boolean().optional() }),
    adminOnly: false,
  },
  {
    name: "get_events",
    description: "Read campus events. Filter by status or date. Use this to find something happening on campus.",
    parameters: obj({
      status: str("upcoming, ongoing, completed, cancelled or full"),
      date: str("ISO date YYYY-MM-DD"),
    }),
    args: z.object({ status: z.string().optional(), date: z.string().optional() }),
    adminOnly: false,
  },
  {
    name: "get_rooms",
    description:
      "Read the room list with their capacity, type and equipment. Filter by type, minimum capacity, or required equipment. This does NOT check availability at a time — use find_available_rooms for that.",
    parameters: obj({
      type: str("classroom, lab or seminar"),
      min_capacity: num("Minimum capacity required"),
      equipment: { type: "array", items: { type: "string" }, description: "Required equipment, e.g. ['projector']" },
    }),
    args: z.object({
      type: z.string().optional(),
      min_capacity: z.number().optional(),
      equipment: z.array(z.string()).optional(),
    }),
    adminOnly: false,
  },
  {
    name: "find_available_rooms",
    description:
      "Find rooms genuinely free for a given date and time window. Accounts for both existing bookings AND timetabled classes. Returns available rooms plus the reason each excluded room is busy. Use this before booking, and whenever the user asks for a room matching size or equipment at a time.",
    parameters: obj(
      {
        date: str("ISO date YYYY-MM-DD"),
        start_time: str("24h HH:MM"),
        end_time: str("24h HH:MM"),
        min_capacity: num("Minimum capacity required"),
        equipment: { type: "array", items: { type: "string" }, description: "Required equipment" },
      },
      ["date", "start_time", "end_time"]
    ),
    args: z.object({
      date: z.string(),
      start_time: z.string(),
      end_time: z.string(),
      min_capacity: z.number().optional(),
      equipment: z.array(z.string()).optional(),
    }),
    adminOnly: false,
  },
  {
    name: "book_room",
    description:
      "Book a room for the current user. Fails if the room is occupied by a booking or a class. Call this once you know the room, date, start time and end time. Purpose is optional — do not ask for it, it defaults sensibly. If the ROOM, DATE or TIME is missing or vague, ask the user instead of guessing.",
    parameters: obj(
      {
        room_number: str("Room code, e.g. '7A02'"),
        date: str("ISO date YYYY-MM-DD"),
        start_time: str("24h HH:MM"),
        end_time: str("24h HH:MM"),
        purpose: str("Optional reason for the booking"),
      },
      ["room_number", "date", "start_time", "end_time"]
    ),
    args: z.object({
      room_number: z.string(),
      date: z.string(),
      start_time: z.string(),
      end_time: z.string(),
      purpose: z.string().optional(),
    }),
    adminOnly: false,
  },
  {
    name: "cancel_booking",
    description: "Cancel a room booking by its booking_id. Users may only cancel their own bookings.",
    parameters: obj({ booking_id: str("The booking_id to cancel") }, ["booking_id"]),
    args: z.object({ booking_id: z.string() }),
    adminOnly: false,
  },
  {
    name: "get_my_bookings",
    description: "List the current user's own room bookings.",
    parameters: obj({}),
    args: z.object({}),
    adminOnly: false,
  },
  {
    name: "register_for_event",
    description:
      "Register the current user for an event. Accepts either the event id or the event name. Fails if the event is full or the user is already registered.",
    parameters: obj({ event: str("Event id (e.g. 'evt-002') or the event name") }, ["event"]),
    args: z.object({ event: z.string() }),
    adminOnly: false,
  },
  {
    name: "cancel_registration",
    description: "Cancel the current user's registration for an event, by event id or name.",
    parameters: obj({ event: str("Event id or name") }, ["event"]),
    args: z.object({ event: z.string() }),
    adminOnly: false,
  },
  {
    name: "create_announcement",
    description: "Post a new campus announcement. Admin only.",
    parameters: obj(
      {
        title: str("Headline"),
        body: str("Full text"),
        priority: str("high, medium or low"),
        expires: str("ISO date YYYY-MM-DD"),
      },
      ["title", "body", "priority", "expires"]
    ),
    args: z.object({ title: z.string(), body: z.string(), priority: z.string(), expires: z.string() }),
    adminOnly: true,
  },
  {
    name: "update_announcement",
    description: "Edit an existing announcement by id. Admin only.",
    parameters: obj({ id: str("Announcement id"), title: str("New title"), body: str("New body"), priority: str("New priority") }, ["id"]),
    args: z.object({ id: z.string(), title: z.string().optional(), body: z.string().optional(), priority: z.string().optional() }),
    adminOnly: true,
  },
  {
    name: "delete_announcement",
    description: "Delete an announcement by id. Admin only.",
    parameters: obj({ id: str("Announcement id") }, ["id"]),
    args: z.object({ id: z.string() }),
    adminOnly: true,
  },
  {
    name: "find_common_free_slot",
    description:
      "Find time windows where two or more students are all free on a given day, by cross-referencing their class timetables, then suggest a genuinely available room for that window. Use when asked to find a joint study time or a group meeting slot.",
    parameters: obj(
      {
        sections: { type: "array", items: { type: "string" }, description: "Section labels of the students to cross-reference, e.g. ['A','B']. Include the current user's own section." },
        day: str("Day of week: Sunday, Monday, Tuesday, Wednesday or Thursday"),
        date: str("ISO date matching that day, needed to check room availability"),
        min_duration_minutes: num("Minimum length of the free window required, default 30"),
      },
      ["sections", "day", "date"]
    ),
    args: z.object({
      sections: z.array(z.string()).min(2),
      day: z.string(),
      date: z.string(),
      min_duration_minutes: z.number().optional(),
    }),
    adminOnly: false,
  },
  {
    name: "get_campus_analytics",
    description:
      "Get pre-computed campus-wide analytics: room utilization for a date, assignment status breakdown, event capacity vs registrations, bookings by hour of day, and weekly class load by day. Use when asked to analyze, summarize or visualize campus data.",
    parameters: obj({ date: str("ISO date to compute room utilization for; defaults to today") }),
    args: z.object({ date: z.string().optional() }),
    adminOnly: false,
  },
  {
    name: "create_schedule",
    description:
      "Add a new class to the timetable. Admin only. Checks the room is free at that day/time against the rest of the timetable before writing; if it is not, returns a conflict instead of creating a clash.",
    parameters: obj(
      {
        course: str("Course code, e.g. 'CSE 4113'"),
        title: str("Course title"),
        day: str("Sunday, Monday, Tuesday, Wednesday or Thursday"),
        start_time: str("24h HH:MM"),
        end_time: str("24h HH:MM"),
        room: str("Room number, e.g. '7A02'"),
        instructor: str("Instructor name"),
        section: str("Section label, e.g. 'B'"),
      },
      ["course", "title", "day", "start_time", "end_time", "room", "instructor", "section"]
    ),
    args: z.object({
      course: z.string(),
      title: z.string(),
      day: z.string(),
      start_time: z.string(),
      end_time: z.string(),
      room: z.string(),
      instructor: z.string(),
      section: z.string(),
    }),
    adminOnly: true,
  },
  {
    name: "create_room",
    description: "Add a new room. Admin only.",
    parameters: obj(
      {
        room_number: str("Room code, e.g. '7A02'"),
        type: str("classroom, lab or seminar"),
        capacity: num("Seating capacity"),
        equipment: { type: "array", items: { type: "string" }, description: "e.g. ['projector','whiteboard']" },
        floor: num("Floor number"),
      },
      ["room_number", "type", "capacity", "floor"]
    ),
    args: z.object({
      room_number: z.string(),
      type: z.string(),
      capacity: z.number(),
      equipment: z.array(z.string()).optional(),
      floor: z.number(),
    }),
    adminOnly: true,
  },
  {
    name: "update_room",
    description: "Edit a room's type, capacity, equipment, floor or status by room_number. Admin only.",
    parameters: obj(
      {
        room_number: str("Room to edit"),
        type: str("New type"),
        capacity: num("New capacity"),
        equipment: { type: "array", items: { type: "string" }, description: "New equipment list" },
        floor: num("New floor"),
        status: str("available or unavailable"),
      },
      ["room_number"]
    ),
    args: z.object({
      room_number: z.string(),
      type: z.string().optional(),
      capacity: z.number().optional(),
      equipment: z.array(z.string()).optional(),
      floor: z.number().optional(),
      status: z.string().optional(),
    }),
    adminOnly: true,
  },
  {
    name: "delete_room",
    description: "Remove a room by room_number. Admin only.",
    parameters: obj({ room_number: str("Room to remove") }, ["room_number"]),
    args: z.object({ room_number: z.string() }),
    adminOnly: true,
  },
  {
    name: "create_event",
    description: "Add a new campus event. Admin only.",
    parameters: obj(
      {
        name: str("Event name"),
        description: str("Event description"),
        date: str("ISO date YYYY-MM-DD"),
        start_time: str("24h HH:MM"),
        end_time: str("24h HH:MM"),
        end_date: str("ISO date YYYY-MM-DD, same as date for single-day events"),
        venue: str("Where it is held"),
        organizer: str("Who is organizing it"),
        capacity: num("Maximum attendees"),
      },
      ["name", "description", "date", "start_time", "end_time", "end_date", "venue", "organizer", "capacity"]
    ),
    args: z.object({
      name: z.string(),
      description: z.string(),
      date: z.string(),
      start_time: z.string(),
      end_time: z.string(),
      end_date: z.string(),
      venue: z.string(),
      organizer: z.string(),
      capacity: z.number(),
    }),
    adminOnly: true,
  },
  {
    name: "update_event",
    description: "Edit an event by id. Admin only.",
    parameters: obj(
      {
        id: str("Event id"),
        name: str("New name"),
        description: str("New description"),
        date: str("New ISO date"),
        start_time: str("New start HH:MM"),
        end_time: str("New end HH:MM"),
        venue: str("New venue"),
        capacity: num("New capacity"),
        status: str("upcoming, ongoing, completed, cancelled or full"),
      },
      ["id"]
    ),
    args: z.object({
      id: z.string(),
      name: z.string().optional(),
      description: z.string().optional(),
      date: z.string().optional(),
      start_time: z.string().optional(),
      end_time: z.string().optional(),
      venue: z.string().optional(),
      capacity: z.number().optional(),
      status: z.string().optional(),
    }),
    adminOnly: true,
  },
  {
    name: "delete_event",
    description: "Remove an event by id. Admin only.",
    parameters: obj({ id: str("Event id") }, ["id"]),
    args: z.object({ id: z.string() }),
    adminOnly: true,
  },
  {
    name: "create_assignment",
    description: "Add a new assignment. Admin only.",
    parameters: obj(
      {
        course: str("Course code"),
        course_title: str("Course title"),
        title: str("Assignment title"),
        description: str("Assignment description"),
        assigned_date: str("ISO date it was assigned"),
        deadline: str("ISO date it is due"),
        submission_platform: str("Where it is submitted, e.g. 'Google Classroom'"),
        marks: num("Total marks"),
      },
      ["course", "course_title", "title", "description", "assigned_date", "deadline", "submission_platform", "marks"]
    ),
    args: z.object({
      course: z.string(),
      course_title: z.string(),
      title: z.string(),
      description: z.string(),
      assigned_date: z.string(),
      deadline: z.string(),
      submission_platform: z.string(),
      marks: z.number(),
    }),
    adminOnly: true,
  },
  {
    name: "update_assignment",
    description: "Edit an assignment by id — deadline, status, marks, title or description. Admin only.",
    parameters: obj(
      {
        id: str("Assignment id"),
        title: str("New title"),
        description: str("New description"),
        deadline: str("New ISO deadline"),
        status: str("pending, submitted, graded or late"),
        marks: num("New marks"),
      },
      ["id"]
    ),
    args: z.object({
      id: z.string(),
      title: z.string().optional(),
      description: z.string().optional(),
      deadline: z.string().optional(),
      status: z.string().optional(),
      marks: z.number().optional(),
    }),
    adminOnly: true,
  },
  {
    name: "delete_assignment",
    description: "Remove an assignment by id. Admin only.",
    parameters: obj({ id: str("Assignment id") }, ["id"]),
    args: z.object({ id: z.string() }),
    adminOnly: true,
  },
  {
    name: "bulk_reschedule_instructor",
    description:
      "Shift every class taught by one instructor later or earlier by a number of minutes, optionally limited to one day. Admin only. TWO-STEP: call with confirm=false (or omitted) first — this previews the affected classes and writes nothing. Only call again with confirm=true after the user has explicitly agreed to the preview.",
    parameters: obj(
      {
        instructor: str("Instructor name to match"),
        delta_minutes: num("Minutes to shift; negative shifts earlier"),
        day: str("Optional: limit to one day"),
        confirm: { type: "boolean", description: "false/omitted = preview only, no writes. true = perform the writes." },
      },
      ["instructor", "delta_minutes"]
    ),
    args: z.object({
      instructor: z.string(),
      delta_minutes: z.number(),
      day: z.string().optional(),
      confirm: z.boolean().optional(),
    }),
    adminOnly: true,
  },
  {
    name: "bulk_clear_expired_announcements",
    description:
      "Delete every announcement whose expiry date has already passed (or passed a given cutoff date). Admin only. TWO-STEP: call with confirm=false (or omitted) first to preview which announcements would be deleted, writing nothing. Only call again with confirm=true after the user explicitly agrees.",
    parameters: obj({
      before_date: str("Optional ISO cutoff date; defaults to today"),
      confirm: { type: "boolean", description: "false/omitted = preview only, no writes. true = perform the deletion." },
    }),
    args: z.object({ before_date: z.string().optional(), confirm: z.boolean().optional() }),
    adminOnly: true,
  },
  {
    name: "update_schedule",
    description: "Change a class in the timetable by schedule id (room, time or day). Admin only.",
    parameters: obj({ id: str("Schedule id"), room: str("New room"), start_time: str("New start HH:MM"), end_time: str("New end HH:MM"), day: str("New day") }, ["id"]),
    args: z.object({
      id: z.string(),
      room: z.string().optional(),
      start_time: z.string().optional(),
      end_time: z.string().optional(),
      day: z.string().optional(),
    }),
    adminOnly: true,
  },
  {
    name: "delete_schedule",
    description: "Remove a class from the timetable by id, i.e. cancel a class. Admin only.",
    parameters: obj({ id: str("Schedule id") }, ["id"]),
    args: z.object({ id: z.string() }),
    adminOnly: true,
  },
];

export const TOOLS_BY_NAME = new Map(TOOLS.map((t) => [t.name, t]));

export function toOpenAiTools() {
  return TOOLS.map((t) => ({
    type: "function" as const,
    function: { name: t.name, description: t.description, parameters: t.parameters },
  }));
}

export function toGeminiTools() {
  return [
    {
      functionDeclarations: TOOLS.map((t) => ({
        name: t.name,
        description: t.description,
        parameters: t.parameters,
      })),
    },
  ];
}
