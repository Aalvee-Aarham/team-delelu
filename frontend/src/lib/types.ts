export interface User {
  student_id: string;
  name: string;
  email: string;
  section: string;
  role: "student" | "admin";
}

export interface Schedule {
  id: string;
  course: string;
  title: string;
  day: string;
  start_time: string;
  end_time: string;
  room: string;
  instructor: string;
  section: string;
}

export interface Booking {
  booking_id: string;
  booked_by: string;
  date: string;
  start_time: string;
  end_time: string;
  purpose: string;
}

export interface Room {
  id: string;
  room_number: string;
  type: "classroom" | "lab" | "seminar";
  capacity: number;
  equipment: string[];
  floor: number;
  status: "available" | "unavailable";
  bookings: Booking[];
}

export interface Registration {
  student_id: string;
  name: string;
}

export interface CampusEvent {
  id: string;
  name: string;
  description: string;
  date: string;
  start_time: string;
  end_time: string;
  end_date: string;
  venue: string;
  organizer: string;
  capacity: number;
  registered: number;
  registrations: Registration[];
  status: "upcoming" | "ongoing" | "completed" | "cancelled" | "full";
  image_url: string;
  image_credit: string;
  image_provider: "unsplash" | "uploadthing" | "cloudinary" | "local";
}

export interface Attachment {
  url: string;
  name: string;
  mime: string;
  size: number;
  provider: "cloudinary" | "uploadthing" | "local" | "link";
  kind: "image" | "pdf" | "file";
}

export interface Course {
  id: string;
  code: string;
  title: string;
  description: string;
  section: string;
  instructor: string;
  room: string;
  term: string;
  cover_url: string;
  cover_credit: string;
  accent: string;
  enrolled: string[];
  archived: boolean;
  created_at: string;
}

export interface Submission {
  id: string;
  assignment_id: string;
  assignment_title: string;
  course_id: string;
  course_code: string;
  student_id: string;
  student_name: string;
  text: string;
  attachments: Attachment[];
  submitted_at: string;
  late: boolean;
  status: "submitted" | "accepted" | "rejected" | "returned";
  grade: number | null;
  feedback: string;
  reviewed_by: string;
  reviewed_at: string;
}

export type CommentTarget = "assignment" | "announcement" | "course" | "event" | "submission";

export interface Comment {
  id: string;
  target_type: CommentTarget;
  target_id: string;
  course_id: string;
  parent_id: string;
  author_id: string;
  author_name: string;
  author_role: "student" | "admin";
  body: string;
  created_at: string;
}

export interface CourseStream {
  course: Course;
  assignments: Assignment[];
  announcements: Announcement[];
  submissions: Submission[];
}

export interface UploadConfig {
  submissions: "cloudinary" | "local";
  images: "uploadthing" | "local";
  maxMb: number;
}

export interface Announcement {
  id: string;
  course_id: string;
  title: string;
  body: string;
  date: string;
  priority: "high" | "medium" | "low";
  posted_by: string;
  expires: string;
}

export interface Assignment {
  id: string;
  course_id: string;
  course: string;
  course_title: string;
  title: string;
  description: string;
  assigned_date: string;
  deadline: string;
  submission_platform: string;
  status: "pending" | "submitted" | "graded" | "late";
  marks: number;
  attachments: Attachment[];
  accepts_text: boolean;
  accepts_files: boolean;
}

export interface Provenance {
  collection: string;
  id: string;
}

export interface TraceEntry {
  tool: string;
  args: Record<string, unknown>;
  ok: boolean;
  rowCount: number;
  latencyMs: number;
}

export interface AgentResponse {
  reply: string;
  toolCalls: TraceEntry[];
  provenance: Provenance[];
  provider: string;
  model: string;
  label: string;
  failovers: { label: string; error: string }[];
  latencyMs: number;
}

export interface CampusAnalytics {
  date: string;
  roomUtilization: { total: number; busy: number; free: number };
  assignmentStatus: { status: string; count: number }[];
  eventCapacity: { event: string; capacity: number; registered: number }[];
  bookingsByHour: { hour: number; count: number }[];
  weeklyClassLoad: { day: string; count: number }[];
}

export interface ChangeEvent {
  type: "change";
  collection: string;
  action: "create" | "update" | "delete";
  id: string;
  at: string;
}
