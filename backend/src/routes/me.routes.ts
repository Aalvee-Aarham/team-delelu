import { Router } from "express";
import { Booking } from "../models/booking.model";
import { Event } from "../models/event.model";
import { requireAuth } from "../middleware/auth";

export const meRouter = Router();

meRouter.get("/bookings", requireAuth, async (req, res, next) => {
  try {
    const bookings = await Booking.find({ booked_by: req.auth!.userId }).sort({ date: 1, start_time: 1 });
    res.json(bookings);
  } catch (err) {
    next(err);
  }
});

meRouter.get("/registrations", requireAuth, async (req, res, next) => {
  try {
    const events = await Event.find({ "registrations.student_id": req.auth!.student_id }).sort({ date: 1 });
    res.json(events);
  } catch (err) {
    next(err);
  }
});
