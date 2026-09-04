import { HydratedDocument } from "mongoose";
import { Room, RoomDoc } from "../models/room.model";
import { Booking } from "../models/booking.model";
import { Schedule } from "../models/schedule.model";

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function dayNameFromDate(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}

export function timesOverlap(startA: string, endA: string, startB: string, endB: string): boolean {
  return startA < endB && startB < endA;
}

export async function attachBookings(rooms: HydratedDocument<RoomDoc>[]) {
  const roomNumbers = rooms.map((r) => r.room_number);
  const bookings = await Booking.find({ room_number: { $in: roomNumbers } });
  const byRoom = new Map<string, typeof bookings>();
  for (const b of bookings) {
    const list = byRoom.get(b.room_number) ?? [];
    list.push(b);
    byRoom.set(b.room_number, list);
  }
  return rooms.map((r) => ({
    ...r.toObject(),
    bookings: (byRoom.get(r.room_number) ?? []).map((b) => ({
      booking_id: b.booking_id,
      booked_by: b.booked_by_name,
      date: b.date,
      start_time: b.start_time,
      end_time: b.end_time,
      purpose: b.purpose,
    })),
  }));
}

export interface RoomConflictReason {
  type: "booking" | "class";
  detail: string;
}

export async function findRoomConflict(
  room_number: string,
  date: string,
  start_time: string,
  end_time: string
): Promise<RoomConflictReason | null> {
  const bookings = await Booking.find({ room_number, date });
  for (const b of bookings) {
    if (timesOverlap(start_time, end_time, b.start_time, b.end_time)) {
      return { type: "booking", detail: `Already booked by ${b.booked_by_name} for ${b.purpose} (${b.start_time}-${b.end_time})` };
    }
  }

  const day = dayNameFromDate(date);
  const classes = await Schedule.find({ room: room_number, day });
  for (const c of classes) {
    if (timesOverlap(start_time, end_time, c.start_time, c.end_time)) {
      return { type: "class", detail: `${c.course} (${c.title}) is scheduled here ${c.start_time}-${c.end_time}` };
    }
  }

  return null;
}

export async function findAvailableRooms(params: {
  date: string;
  start_time: string;
  end_time: string;
  min_capacity?: number;
  equipment?: string[];
}) {
  const filter: Record<string, unknown> = { status: "available" };
  if (params.min_capacity) filter.capacity = { $gte: params.min_capacity };
  if (params.equipment && params.equipment.length > 0) filter.equipment = { $all: params.equipment };

  const candidates = await Room.find(filter);
  const available: RoomDoc[] = [];
  const conflicts: { room_number: string; reason: RoomConflictReason }[] = [];

  for (const room of candidates) {
    const conflict = await findRoomConflict(room.room_number, params.date, params.start_time, params.end_time);
    if (conflict) {
      conflicts.push({ room_number: room.room_number, reason: conflict });
    } else {
      available.push(room);
    }
  }

  return { available, conflicts };
}
