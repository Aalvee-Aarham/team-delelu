import { Schema, model } from "mongoose";

export interface ScheduleDoc {
  id: string;
  course: string;
  title: string;
  day: "Sunday" | "Monday" | "Tuesday" | "Wednesday" | "Thursday";
  start_time: string;
  end_time: string;
  room: string;
  instructor: string;
  section: string;
}

const scheduleSchema = new Schema<ScheduleDoc>({
  id: { type: String, required: true, unique: true },
  course: { type: String, required: true },
  title: { type: String, required: true },
  day: { type: String, required: true },
  start_time: { type: String, required: true },
  end_time: { type: String, required: true },
  room: { type: String, required: true },
  instructor: { type: String, required: true },
  section: { type: String, required: true },
}, { versionKey: false });

scheduleSchema.index({ day: 1, section: 1 });

export const Schedule = model<ScheduleDoc>("Schedule", scheduleSchema);
