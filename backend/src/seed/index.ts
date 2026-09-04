import path from "path";
import fs from "fs";
import bcrypt from "bcryptjs";
import { Schedule } from "../models/schedule.model";
import { Room } from "../models/room.model";
import { Booking } from "../models/booking.model";
import { Event } from "../models/event.model";
import { Announcement } from "../models/announcement.model";
import { Assignment } from "../models/assignment.model";
import { User } from "../models/user.model";
import { Course } from "../models/course.model";
import { Submission } from "../models/submission.model";
import { Comment } from "../models/comment.model";
import { backfillCourseLinks, backfillEventImages } from "./backfill";

const dataDir = path.join(__dirname, "..", "..", "..", "data");

function readJson<T>(file: string): T {
  return JSON.parse(fs.readFileSync(path.join(dataDir, file), "utf-8"));
}

interface SeedRoom {
  id: string;
  room_number: string;
  type: string;
  capacity: number;
  equipment: string[];
  floor: number;
  status: string;
  bookings: {
    booking_id: string;
    booked_by: string;
    date: string;
    start_time: string;
    end_time: string;
    purpose: string;
  }[];
}

async function seedCollection<T>(model: { countDocuments(): Promise<number>; insertMany(docs: T[]): Promise<unknown> }, file: string, label: string) {
  const count = await model.countDocuments();
  if (count > 0) {
    console.log(`[seed] ${label} already seeded (${count} docs)`);
    return;
  }
  const docs = readJson<T[]>(file);
  await model.insertMany(docs);
  console.log(`[seed] ${label}: inserted ${docs.length} docs`);
}

async function seedRoomsAndBookings() {
  const roomCount = await Room.countDocuments();
  if (roomCount > 0) {
    console.log(`[seed] rooms already seeded (${roomCount} docs)`);
    return;
  }
  const rooms = readJson<SeedRoom[]>("rooms.json");
  const roomDocs = rooms.map(({ bookings, ...rest }) => rest);
  await Room.insertMany(roomDocs);
  console.log(`[seed] rooms: inserted ${roomDocs.length} docs`);

  const bookingCount = await Booking.countDocuments();
  if (bookingCount === 0) {
    const bookingDocs = rooms.flatMap((r) =>
      r.bookings.map((b) => ({
        booking_id: b.booking_id,
        room_number: r.room_number,
        booked_by: "seed",
        booked_by_name: b.booked_by,
        date: b.date,
        start_time: b.start_time,
        end_time: b.end_time,
        purpose: b.purpose,
      }))
    );
    if (bookingDocs.length > 0) {
      await Booking.insertMany(bookingDocs);
      console.log(`[seed] bookings: inserted ${bookingDocs.length} docs`);
    }
  }
}

async function seedDemoUsers() {
  const passwordHash = await bcrypt.hash("campus123", 10);
  const demoUsers = [
    {
      student_id: "20-00000",
      name: "Demo Student",
      email: "student@campusos.edu",
      passwordHash,
      section: "B",
      year: 4,
      semester: 1,
      department: "CSE",
      role: "student",
    },
    {
      student_id: "20-00001",
      name: "Demo Admin",
      email: "admin@campusos.edu",
      passwordHash,
      section: "N/A",
      year: 0,
      semester: 0,
      department: "CSE",
      role: "admin",
    },
    {
      student_id: "20-40532",
      name: "Sakibul Hassan",
      email: "sakib@campusos.edu",
      passwordHash,
      section: "B",
      year: 4,
      semester: 1,
      department: "CSE",
      role: "student",
    },
    {
      student_id: "20-40511",
      name: "Farhan Ahmed",
      email: "farhan@campusos.edu",
      passwordHash,
      section: "B",
      year: 4,
      semester: 1,
      department: "CSE",
      role: "student",
    },
  ];

  for (const u of demoUsers) {
    await User.findOneAndUpdate({ student_id: u.student_id }, { $setOnInsert: u }, { upsert: true, new: true });
  }
  console.log(`[seed] demo users ready (checked ${demoUsers.length} accounts)`);
}

export async function runSeed() {
  await seedCollection(Schedule, "schedules.json", "schedules");
  await seedRoomsAndBookings();
  await seedCollection(Event, "events.json", "events");
  await seedCollection(Announcement, "announcements.json", "announcements");
  await seedCollection(Course, "courses.json", "courses");
  await seedCollection(Assignment, "assignments.json", "assignments");
  await seedCollection(Submission, "submissions.json", "submissions");
  await seedCollection(Comment, "comments.json", "comments");
  await seedDemoUsers();
  await backfillCourseLinks();
  await backfillEventImages();
}
