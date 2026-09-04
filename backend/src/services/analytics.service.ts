import { Room } from "../models/room.model";
import { Booking } from "../models/booking.model";
import { Schedule } from "../models/schedule.model";
import { Event } from "../models/event.model";
import { Assignment } from "../models/assignment.model";
import { dayNameFromDate } from "./rooms.service";

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"];

export interface CampusAnalytics {
  date: string;
  roomUtilization: { total: number; busy: number; free: number };
  assignmentStatus: { status: string; count: number }[];
  eventCapacity: { event: string; capacity: number; registered: number }[];
  bookingsByHour: { hour: number; count: number }[];
  weeklyClassLoad: { day: string; count: number }[];
}

export async function computeAnalytics(date?: string): Promise<CampusAnalytics> {
  const targetDate = date || new Date().toISOString().slice(0, 10);
  const day = dayNameFromDate(targetDate);

  const [rooms, bookingsToday, classesToday, assignments, events, allBookings, weeklyClasses] = await Promise.all([
    Room.find(),
    Booking.find({ date: targetDate }),
    Schedule.find({ day }),
    Assignment.find(),
    Event.find(),
    Booking.find(),
    Schedule.find(),
  ]);

  const busyRoomNumbers = new Set<string>([
    ...bookingsToday.map((b) => b.room_number),
    ...classesToday.map((c) => c.room),
  ]);
  const total = rooms.length;
  const busy = rooms.filter((r) => busyRoomNumbers.has(r.room_number)).length;

  const statusCounts = new Map<string, number>();
  for (const a of assignments) statusCounts.set(a.status, (statusCounts.get(a.status) ?? 0) + 1);

  const hourCounts = new Map<number, number>();
  for (const b of allBookings) {
    const hour = Number(b.start_time.split(":")[0]);
    hourCounts.set(hour, (hourCounts.get(hour) ?? 0) + 1);
  }

  const dayCounts = new Map<string, number>();
  for (const c of weeklyClasses) dayCounts.set(c.day, (dayCounts.get(c.day) ?? 0) + 1);

  return {
    date: targetDate,
    roomUtilization: { total, busy, free: total - busy },
    assignmentStatus: Array.from(statusCounts, ([status, count]) => ({ status, count })),
    eventCapacity: events.map((e) => ({ event: e.name, capacity: e.capacity, registered: e.registered })),
    bookingsByHour: Array.from({ length: 24 }, (_, hour) => ({ hour, count: hourCounts.get(hour) ?? 0 })).filter((h) => h.count > 0),
    weeklyClassLoad: WEEKDAYS.map((d) => ({ day: d, count: dayCounts.get(d) ?? 0 })),
  };
}
