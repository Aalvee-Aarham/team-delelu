import {
  BellRing,
  CalendarDays,
  ClipboardList,
  DoorOpen,
  PartyPopper,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Tone } from "@/lib/tone";

export interface Feature {
  icon: LucideIcon;
  tone: Tone;
  title: string;
  copy: string;
  points: string[];
}

export const FEATURES: Feature[] = [
  {
    icon: CalendarDays,
    tone: "blue",
    title: "Schedules",
    copy: "The timetable for every section, with the announcement that changed it attached to the class it changed.",
    points: ["Section + day filters", "Clash detection", "Full add / edit / delete"],
  },
  {
    icon: DoorOpen,
    tone: "violet",
    title: "Rooms",
    copy: "Capacity, equipment and real availability — bookings and timetabled classes counted together.",
    points: ["Equipment search", "Live booking check", "Conflict explained, not just refused"],
  },
  {
    icon: PartyPopper,
    tone: "cyan",
    title: "Events",
    copy: "Campus events with seat counts that move as people register, on every open tab at once.",
    points: ["Seat tracking", "Register in one call", "Status pills stay current"],
  },
  {
    icon: BellRing,
    tone: "red",
    title: "Announcements",
    copy: "Notices ranked by priority, and read by the agent before it answers anything about your day.",
    points: ["Priority tiers", "Scoped to your section", "Feeds every answer"],
  },
  {
    icon: ClipboardList,
    tone: "amber",
    title: "Assignments",
    copy: "Deadlines, submissions and grades in one table that the agent can query the way you would ask.",
    points: ["Due-this-week view", "Submission state", "Grade history"],
  },
  {
    icon: Sparkles,
    tone: "green",
    title: "The agent",
    copy: "Sixteen typed tools over the same MongoDB the dashboard writes to. No cached copy of the seed data.",
    points: ["Reads and mutates live", "Refuses what your role can't do", "Asks instead of guessing"],
  },
];

export interface DemoTool {
  name: string;
  args: string;
  rows: string;
  ms: number;
}

export interface DemoScript {
  id: string;
  question: string;
  chip: string;
  tools: DemoTool[];
  answer: string;
  provider: string;
}

export const DEMO_SCRIPTS: DemoScript[] = [
  {
    id: "next-class",
    question: "When is my next class?",
    chip: "My next class",
    tools: [
      { name: "get_user_context", args: '{ }', rows: "1 record", ms: 41 },
      {
        name: "list_schedules",
        args: '{ section: "B", day: "Monday" }',
        rows: "6 records",
        ms: 88,
      },
      {
        name: "list_announcements",
        args: '{ scope: "schedule", active: true }',
        rows: "3 records",
        ms: 63,
      },
    ],
    answer:
      "Your next class is CSE 4113 — Machine Learning at 11:00 today. Note the room changed: an announcement posted yesterday moved it from 3B14 to Room 7A02 for the rest of the term.",
    provider: "groq · openai/gpt-oss-120b",
  },
  {
    id: "find-room",
    question: "Which labs have a projector and fit at least 30 people?",
    chip: "Find me a lab",
    tools: [
      {
        name: "find_rooms",
        args: '{ type: "lab", minCapacity: 30, equipment: ["projector"] }',
        rows: "3 records",
        ms: 74,
      },
      { name: "check_room_availability", args: '{ roomIds: [3], window: "today" }', rows: "3 records", ms: 96 },
    ],
    answer:
      "Three labs match: 7A02 (40 seats, free after 13:00), 4C11 (36 seats, booked until 15:00) and 2B08 (32 seats, free all afternoon). All three have a projector.",
    provider: "groq · openai/gpt-oss-120b",
  },
  {
    id: "book",
    question: "Book Room 7A02 tomorrow from 3 PM to 5 PM.",
    chip: "Book a room",
    tools: [
      { name: "find_room_by_code", args: '{ code: "7A02" }', rows: "1 record", ms: 38 },
      {
        name: "check_room_availability",
        args: '{ roomId: 7, from: "15:00", to: "17:00" }',
        rows: "0 conflicts",
        ms: 82,
      },
      {
        name: "list_schedules",
        args: '{ roomId: 7, day: "Tuesday" }',
        rows: "2 records",
        ms: 57,
      },
      {
        name: "create_booking",
        args: '{ roomId: 7, from: "15:00", to: "17:00" }',
        rows: "1 written",
        ms: 118,
      },
    ],
    answer:
      "Booked. Room 7A02 is yours tomorrow 15:00–17:00. I checked both existing bookings and the timetable first — the 13:00 lab ends at 14:50, so there is no clash.",
    provider: "groq · openai/gpt-oss-120b",
  },
  {
    id: "refuse",
    question: "Cancel tomorrow's CSE 4113 class.",
    chip: "Try something you can't",
    tools: [
      { name: "get_user_context", args: '{ }', rows: "role: student", ms: 36 },
      {
        name: "authorize_action",
        args: '{ action: "delete", resource: "schedule" }',
        rows: "denied",
        ms: 22,
      },
    ],
    answer:
      "I can't cancel that — cancelling a class needs an admin role and you're signed in as a student. Sign in as admin and ask again, and it goes through.",
    provider: "gemini · gemini-3.8-flash (failover)",
  },
];

export interface FlowStep {
  step: string;
  title: string;
  copy: string;
  tone: Tone;
}

export const FLOW_STEPS: FlowStep[] = [
  {
    step: "01",
    title: "You ask in plain language",
    copy: "The agent already knows who you are, so \"my\" resolves to your section and student ID before a single tool runs.",
    tone: "blue",
  },
  {
    step: "02",
    title: "It picks real tools",
    copy: "Sixteen typed functions query and mutate MongoDB directly. Vague request? It asks which room and which time rather than booking something.",
    tone: "violet",
  },
  {
    step: "03",
    title: "Your role is enforced",
    copy: "Authorisation is checked at the tool boundary, not in the prompt. A student is refused the same action an admin completes.",
    tone: "amber",
  },
  {
    step: "04",
    title: "Everything stays in sync",
    copy: "Writes push to every open tab over Server-Sent Events, and each answer remembers which records it came from.",
    tone: "green",
  },
];

export const STACK = [
  "React 19",
  "Vite",
  "TypeScript",
  "Express 4",
  "MongoDB",
  "Mongoose 8",
  "TanStack Query",
  "Tailwind 4",
  "shadcn/ui",
  "Server-Sent Events",
  "JWT auth",
  "zod",
  "Groq",
  "Gemini failover",
  "16 typed tools",
];

export interface RoleSpec {
  id: "student" | "admin";
  label: string;
  email: string;
  password: string;
  blurb: string;
  can: string[];
  cannot: string[];
}

export const ROLES: RoleSpec[] = [
  {
    id: "student",
    label: "Student",
    email: "student@campusos.edu",
    password: "campus123",
    blurb: "Everything read-only, plus the actions that are genuinely yours to take.",
    can: [
      "Ask anything about your schedule, rooms, events and deadlines",
      "Book a free room and register for an event",
      "See the full tool trace behind every answer",
    ],
    cannot: ["Cancel or edit a class", "Delete announcements", "Change another student's records"],
  },
  {
    id: "admin",
    label: "Admin",
    email: "admin@campusos.edu",
    password: "campus123",
    blurb: "The same agent, the same tools — with the write actions unlocked.",
    can: [
      "Add, edit and delete across all five systems",
      "Cancel or reschedule a class and have it announced",
      "Watch the change land in every open tab instantly",
    ],
    cannot: ["Bypass the audit trail — every mutation is still traced"],
  },
];