import { Schema, model } from "mongoose";

export type CommentTarget = "assignment" | "announcement" | "course" | "event" | "submission";

export interface CommentDoc {
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

const commentSchema = new Schema<CommentDoc>({
  id: { type: String, required: true, unique: true },
  target_type: { type: String, enum: ["assignment", "announcement", "course", "event", "submission"], required: true },
  target_id: { type: String, required: true },
  course_id: { type: String, default: "" },
  parent_id: { type: String, default: "" },
  author_id: { type: String, required: true },
  author_name: { type: String, required: true },
  author_role: { type: String, enum: ["student", "admin"], required: true },
  body: { type: String, required: true },
  created_at: { type: String, required: true },
}, { versionKey: false });

commentSchema.index({ target_type: 1, target_id: 1, created_at: 1 });

export const Comment = model<CommentDoc>("Comment", commentSchema);
