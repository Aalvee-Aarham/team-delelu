import { Router } from "express";
import { Booking } from "../models/booking.model";
import { Room } from "../models/room.model";
import { requireAuth } from "../middleware/auth";
import { AppError } from "../middleware/error";
import { publishChange } from "../realtime/sse";

export const bookingsRouter = Router();

bookingsRouter.delete("/:booking_id", requireAuth, async (req, res, next) => {
  try {
    const booking = await Booking.findOne({ booking_id: req.params.booking_id });
    if (!booking) throw new AppError(404, `Booking not found: ${req.params.booking_id}`);
    if (req.auth!.role !== "admin" && booking.booked_by !== req.auth!.userId) {
      throw new AppError(403, "You can only cancel your own bookings");
    }
    await booking.deleteOne();
    const room = await Room.findOne({ room_number: booking.room_number });
    if (room) publishChange("rooms", "update", room.id);
    res.json({ deleted: true });
  } catch (err) {
    next(err);
  }
});
