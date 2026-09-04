import { Schema, model } from "mongoose";

export interface AnnouncementDoc {
  id: string;
  title: string;
  body: string;
  date: string;
  priority: "high" | "medium" | "low";
  posted_by: string;
  expires: string;
}

const announcementSchema = new Schema<AnnouncementDoc>({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  body: { type: String, required: true },
  date: { type: String, required: true },
  priority: { type: String, enum: ["high", "medium", "low"], required: true },
  posted_by: { type: String, required: true },
  expires: { type: String, required: true },
}, { versionKey: false });

announcementSchema.index({ priority: 1, expires: 1 });

export const Announcement = model<AnnouncementDoc>("Announcement", announcementSchema);
