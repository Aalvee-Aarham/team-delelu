import { Router } from "express";
import { z } from "zod";
import { Event } from "../models/event.model";
import { buildCrudRouter } from "./crud.factory";
import { requireAuth } from "../middleware/auth";
import { AppError } from "../middleware/error";
import { publishChange } from "../realtime/sse";

const createSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  date: z.string().min(1),
  start_time: z.string().min(1),
  end_time: z.string().min(1),
  end_date: z.string().min(1),
  venue: z.string().min(1),
  organizer: z.string().min(1),
  capacity: z.number().int().positive(),
  registered: z.number().int().min(0).default(0),
  registrations: z.array(z.object({ student_id: z.string(), name: z.string() })).default([]),
  status: z.enum(["upcoming", "ongoing", "completed", "cancelled", "full"]),
  image_url: z.string().default(""),
  image_credit: z.string().default(""),
  image_provider: z.enum(["unsplash", "uploadthing", "cloudinary", "local"]).default("unsplash"),
});

const updateSchema = createSchema.partial();

export const eventsRouter: Router = buildCrudRouter({
  model: Event,
  collectionName: "events",
  createSchema,
  updateSchema,
  buildFilter: (q) => {
    const filter: Record<string, unknown> = {};
    if (q.status) filter.status = q.status;
    if (q.date) filter.date = q.date;
    return filter;
  },
});

eventsRouter.post("/:id/register", requireAuth, async (req, res, next) => {
  try {
    const event = await Event.findOne({ id: req.params.id });
    if (!event) throw new AppError(404, `Event not found: ${req.params.id}`);
    if (event.registered >= event.capacity) throw new AppError(409, "Event is full");
    const already = event.registrations.some((r) => r.student_id === req.auth!.student_id);
    if (already) throw new AppError(409, "Already registered for this event");

    event.registrations.push({ student_id: req.auth!.student_id, name: req.auth!.name });
    event.registered += 1;
    if (event.registered >= event.capacity) event.status = "full";
    await event.save();
    publishChange("events", "update", event.id);
    res.json(event);
  } catch (err) {
    next(err);
  }
});

eventsRouter.delete("/:id/register", requireAuth, async (req, res, next) => {
  try {
    const event = await Event.findOne({ id: req.params.id });
    if (!event) throw new AppError(404, `Event not found: ${req.params.id}`);
    const idx = event.registrations.findIndex((r) => r.student_id === req.auth!.student_id);
    if (idx === -1) throw new AppError(404, "Not registered for this event");

    event.registrations.splice(idx, 1);
    event.registered = Math.max(0, event.registered - 1);
    if (event.status === "full" && event.registered < event.capacity) event.status = "upcoming";
    await event.save();
    publishChange("events", "update", event.id);
    res.json(event);
  } catch (err) {
    next(err);
  }
});
