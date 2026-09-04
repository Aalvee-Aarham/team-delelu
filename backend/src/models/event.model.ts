import { Schema, model } from "mongoose";

export interface Registration {
  student_id: string;
  name: string;
}

export interface EventDoc {
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

const eventSchema = new Schema<EventDoc>({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  date: { type: String, required: true },
  start_time: { type: String, required: true },
  end_time: { type: String, required: true },
  end_date: { type: String, required: true },
  venue: { type: String, required: true },
  organizer: { type: String, required: true },
  capacity: { type: Number, required: true },
  registered: { type: Number, default: 0 },
  registrations: {
    type: [{ student_id: String, name: String, _id: false }],
    default: [],
  },
  status: { type: String, required: true },
  image_url: { type: String, default: "" },
  image_credit: { type: String, default: "" },
  image_provider: { type: String, enum: ["unsplash", "uploadthing", "cloudinary", "local"], default: "unsplash" },
}, { versionKey: false });

eventSchema.index({ date: 1 });

export const Event = model<EventDoc>("Event", eventSchema);
