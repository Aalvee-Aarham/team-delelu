import { Schema, model } from "mongoose";

export interface AttachmentDoc {
  url: string;
  name: string;
  mime: string;
  size: number;
  provider: "cloudinary" | "uploadthing" | "local" | "link";
  kind: "image" | "pdf" | "file";
}

export interface SubmissionDoc {
  id: string;
  assignment_id: string;
  assignment_title: string;
  course_id: string;
  course_code: string;
  student_id: string;
  student_name: string;
  text: string;
  attachments: AttachmentDoc[];
  submitted_at: string;
  late: boolean;
  status: "submitted" | "accepted" | "rejected" | "returned";
  grade: number | null;
  feedback: string;
  reviewed_by: string;
  reviewed_at: string;
}

export const attachmentSchema = new Schema<AttachmentDoc>({
  url: { type: String, required: true },
  name: { type: String, required: true },
  mime: { type: String, default: "application/octet-stream" },
  size: { type: Number, default: 0 },
  provider: { type: String, enum: ["cloudinary", "uploadthing", "local", "link"], default: "local" },
  kind: { type: String, enum: ["image", "pdf", "file"], default: "file" },
}, { _id: false });

const submissionSchema = new Schema<SubmissionDoc>({
  id: { type: String, required: true, unique: true },
  assignment_id: { type: String, required: true },
  assignment_title: { type: String, default: "" },
  course_id: { type: String, default: "" },
  course_code: { type: String, default: "" },
  student_id: { type: String, required: true },
  student_name: { type: String, required: true },
  text: { type: String, default: "" },
  attachments: { type: [attachmentSchema], default: [] },
  submitted_at: { type: String, required: true },
  late: { type: Boolean, default: false },
  status: { type: String, enum: ["submitted", "accepted", "rejected", "returned"], default: "submitted" },
  grade: { type: Number, default: null },
  feedback: { type: String, default: "" },
  reviewed_by: { type: String, default: "" },
  reviewed_at: { type: String, default: "" },
}, { versionKey: false });

submissionSchema.index({ assignment_id: 1, student_id: 1 }, { unique: true });
submissionSchema.index({ course_id: 1, status: 1 });

export const Submission = model<SubmissionDoc>("Submission", submissionSchema);
