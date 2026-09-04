import { Router } from "express";
import { z } from "zod";
import { Room } from "../models/room.model";
import { Booking } from "../models/booking.model";
import { requireAuth, requireAdmin } from "../middleware/auth";
import { AppError } from "../middleware/error";
import { publishChange } from "../realtime/sse";
import { attachBookings, findAvailableRooms, findRoomConflict } from "../services/rooms.service";

export const roomsRouter = Router();

const createSchema = z.object({
  id: z.string().min(1),
  room_number: z.string().min(1),
  type: z.enum(["classroom", "lab", "seminar"]),
  capacity: z.number().int().positive(),
  equipment: z.array(z.string()).default([]),
  floor: z.number().int(),
  status: z.enum(["available", "unavailable"]).default("available"),
});

const updateSchema = createSchema.partial();

const bookSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  start_time: z.string().regex(/^\d{2}:\d{2}$/),
  end_time: z.string().regex(/^\d{2}:\d{2}$/),
  purpose: z.string().min(1),
});

roomsRouter.get("/availability", requireAuth, async (req, res, next) => {
  try {
    const { date, start_time, end_time, min_capacity, equipment } = req.query;
    if (!date || !start_time || !end_time) {
      throw new AppError(400, "date, start_time and end_time are required");
    }
    const equipmentList = typeof equipment === "string" && equipment.length > 0 ? equipment.split(",") : undefined;
    const result = await findAvailableRooms({
      date: String(date),
      start_time: String(start_time),
      end_time: String(end_time),
      min_capacity: min_capacity ? Number(min_capacity) : undefined,
      equipment: equipmentList,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

roomsRouter.get("/", requireAuth, async (req, res, next) => {
  try {
    const filter: Record<string, unknown> = {};
    if (req.query.type) filter.type = req.query.type;
    if (req.query.min_capacity) filter.capacity = { $gte: Number(req.query.min_capacity) };
    if (typeof req.query.equipment === "string" && req.query.equipment.length > 0) {
      filter.equipment = { $all: req.query.equipment.split(",") };
    }
    const rooms = await Room.find(filter).sort({ room_number: 1 });
    res.json(await attachBookings(rooms));
  } catch (err) {
    next(err);
  }
});

roomsRouter.get("/:id", requireAuth, async (req, res, next) => {
  try {
    const room = await Room.findOne({ id: req.params.id });
    if (!room) throw new AppError(404, `Room not found: ${req.params.id}`);
    const [withBookings] = await attachBookings([room]);
    res.json(withBookings);
  } catch (err) {
    next(err);
  }
});

roomsRouter.post("/", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const room = await Room.create(createSchema.parse(req.body));
    publishChange("rooms", "create", room.id);
    res.status(201).json(room);
  } catch (err) {
    next(err);
  }
});

roomsRouter.patch("/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const room = await Room.findOneAndUpdate({ id: req.params.id }, updateSchema.parse(req.body), { new: true });
    if (!room) throw new AppError(404, `Room not found: ${req.params.id}`);
    publishChange("rooms", "update", room.id);
    const [withBookings] = await attachBookings([room]);
    res.json(withBookings);
  } catch (err) {
    next(err);
  }
});

roomsRouter.delete("/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const room = await Room.findOneAndDelete({ id: req.params.id });
    if (!room) throw new AppError(404, `Room not found: ${req.params.id}`);
    await Booking.deleteMany({ room_number: room.room_number });
    publishChange("rooms", "delete", req.params.id);
    res.json({ deleted: true });
  } catch (err) {
    next(err);
  }
});

roomsRouter.post("/:room_number/book", requireAuth, async (req, res, next) => {
  try {
    const body = bookSchema.parse(req.body);
    if (body.start_time >= body.end_time) {
      throw new AppError(400, "start_time must be before end_time");
    }
    const room = await Room.findOne({ room_number: req.params.room_number });
    if (!room) throw new AppError(404, `Room not found: ${req.params.room_number}`);
    if (room.status === "unavailable") throw new AppError(409, `Room ${room.room_number} is marked unavailable`);

    const conflict = await findRoomConflict(room.room_number, body.date, body.start_time, body.end_time);
    if (conflict) {
      throw new AppError(409, `Room ${room.room_number} is not free at that time. ${conflict.detail}`);
    }

    const booking = await Booking.create({
      booking_id: `bk-${Date.now().toString(36)}`,
      room_number: room.room_number,
      booked_by: req.auth!.userId,
      booked_by_name: req.auth!.name,
      date: body.date,
      start_time: body.start_time,
      end_time: body.end_time,
      purpose: body.purpose,
    });
    publishChange("rooms", "update", room.id);
    res.status(201).json(booking);
  } catch (err) {
    next(err);
  }
});
