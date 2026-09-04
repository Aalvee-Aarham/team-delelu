import { Schema, model } from "mongoose";

export interface RoomDoc {
  id: string;
  room_number: string;
  type: "classroom" | "lab" | "seminar";
  capacity: number;
  equipment: string[];
  floor: number;
  status: "available" | "unavailable";
}

const roomSchema = new Schema<RoomDoc>({
  id: { type: String, required: true, unique: true },
  room_number: { type: String, required: true, unique: true },
  type: { type: String, required: true },
  capacity: { type: Number, required: true },
  equipment: { type: [String], default: [] },
  floor: { type: Number, required: true },
  status: { type: String, enum: ["available", "unavailable"], default: "available" },
}, { versionKey: false });

export const Room = model<RoomDoc>("Room", roomSchema);
