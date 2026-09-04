import { Schema, model } from "mongoose";
import { AttachmentDoc, attachmentSchema } from "./submission.model";

export interface AssignmentDoc {
  id: string;
  course_id: string;
  course: string;
  course_title: string;
  title: string;
  description: string;
  attachments: AttachmentDoc[];
  assigned_date: string;
  deadline: string;
  submission_platform: string;
  status: "pending" | "submitted" | "graded" | "late";
  marks: number;
  accepts_text: boolean;
  accepts_files: boolean;
}

const assignmentSchema = new Schema<AssignmentDoc>({
  id: { type: String, required: true, unique: true },
  course_id: { type: String, default: "" },
  course: { type: String, required: true },
  course_title: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  attachments: { type: [attachmentSchema], default: [] },
  assigned_date: { type: String, required: true },
  deadline: { type: String, required: true },
  submission_platform: { type: String, required: true },
  status: { type: String, enum: ["pending", "submitted", "graded", "late"], required: true },
  marks: { type: Number, required: true },
  accepts_text: { type: Boolean, default: true },
  accepts_files: { type: Boolean, default: true },
}, { versionKey: false });

assignmentSchema.index({ deadline: 1 });
assignmentSchema.index({ course_id: 1 });

export const Assignment = model<AssignmentDoc>("Assignment", assignmentSchema);
