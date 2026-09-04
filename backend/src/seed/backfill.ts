import path from "path";
import fs from "fs";
import { Assignment } from "../models/assignment.model";
import { Announcement } from "../models/announcement.model";
import { Event } from "../models/event.model";

const dataDir = path.join(__dirname, "..", "..", "..", "data");

function readJson<T>(file: string): T {
  return JSON.parse(fs.readFileSync(path.join(dataDir, file), "utf-8"));
}

interface CourseSeed {
  id: string;
  code: string;
}

export async function backfillCourseLinks() {
  const courses = readJson<CourseSeed[]>("courses.json");
  let linked = 0;
  for (const course of courses) {
    const result = await Assignment.updateMany(
      { course: course.code, $or: [{ course_id: { $exists: false } }, { course_id: "" }] },
      { $set: { course_id: course.id } }
    );
    linked += result.modifiedCount;
  }
  if (linked > 0) console.log(`[seed] backfilled course_id on ${linked} assignments`);

  const announcements = readJson<{ id: string; course_id?: string }[]>("announcements.json");
  let tagged = 0;
  for (const ann of announcements.filter((a) => a.course_id)) {
    const result = await Announcement.updateMany(
      { id: ann.id, $or: [{ course_id: { $exists: false } }, { course_id: "" }] },
      { $set: { course_id: ann.course_id } }
    );
    tagged += result.modifiedCount;
  }
  if (tagged > 0) console.log(`[seed] backfilled course_id on ${tagged} announcements`);
}

export async function backfillEventImages() {
  const events = readJson<{ id: string; image_url: string; image_credit: string }[]>("events.json");
  let updated = 0;
  for (const event of events) {
    const result = await Event.updateMany(
      { id: event.id, $or: [{ image_url: { $exists: false } }, { image_url: "" }] },
      { $set: { image_url: event.image_url, image_credit: event.image_credit, image_provider: "unsplash" } }
    );
    updated += result.modifiedCount;
  }
  if (updated > 0) console.log(`[seed] backfilled Unsplash covers on ${updated} events`);
}
