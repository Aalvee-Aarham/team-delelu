import { Schema, model } from "mongoose";

export interface UserDoc {
  student_id: string;
  name: string;
  email: string;
  passwordHash: string;
  section: string;
  year: number;
  semester: number;
  department: string;
  role: "student" | "admin";
  createdAt: Date;
}

const userSchema = new Schema<UserDoc>({
  student_id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  section: { type: String, required: true },
  year: { type: Number, default: 4 },
  semester: { type: Number, default: 1 },
  department: { type: String, default: "CSE" },
  role: { type: String, enum: ["student", "admin"], required: true },
  createdAt: { type: Date, default: Date.now },
});

export const User = model<UserDoc>("User", userSchema);
