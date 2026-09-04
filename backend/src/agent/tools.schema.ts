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
