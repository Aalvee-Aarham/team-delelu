import { Schema, model } from "mongoose";

export interface AssignmentDoc {
  id: string;
  course: string;
  course_title: string;
  title: string;
  description: string;
  assigned_date: string;
  deadline: string;
  submission_platform: string;
  status: "pending" | "submitted" | "graded" | "late";
  marks: number;
}

const assignmentSchema = new Schema<AssignmentDoc>({
  id: { type: String, required: true, unique: true },
  course: { type: String, required: true },
  course_title: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  assigned_date: { type: String, required: true },
  deadline: { type: String, required: true },
  submission_platform: { type: String, required: true },
  status: { type: String, enum: ["pending", "submitted", "graded", "late"], required: true },
  marks: { type: Number, required: true },
}, { versionKey: false });

assignmentSchema.index({ deadline: 1 });

export const Assignment = model<AssignmentDoc>("Assignment", assignmentSchema);
