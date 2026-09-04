import { Schema, model } from "mongoose";

export interface CourseDoc {
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

const courseSchema = new Schema<CourseDoc>({
  id: { type: String, required: true, unique: true },
  code: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, default: "" },
  section: { type: String, default: "" },
  instructor: { type: String, default: "TBA" },
  room: { type: String, default: "" },
  term: { type: String, default: "" },
  cover_url: { type: String, default: "" },
  cover_credit: { type: String, default: "" },
  accent: { type: String, default: "blue" },
  enrolled: { type: [String], default: [] },
  archived: { type: Boolean, default: false },
  created_at: { type: String, default: () => new Date().toISOString() },
}, { versionKey: false });

courseSchema.index({ code: 1 });

export const Course = model<CourseDoc>("Course", courseSchema);
