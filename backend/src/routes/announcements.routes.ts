import { z } from "zod";
import { Announcement } from "../models/announcement.model";
import { buildCrudRouter } from "./crud.factory";

const createSchema = z.object({
  id: z.string().min(1),
  course_id: z.string().default(""),
  title: z.string().min(1),
  body: z.string().min(1),
  date: z.string().min(1),
  priority: z.enum(["high", "medium", "low"]),
  posted_by: z.string().min(1),
  expires: z.string().min(1),
});

const updateSchema = createSchema.partial();

export const announcementsRouter = buildCrudRouter({
  model: Announcement,
  collectionName: "announcements",
  createSchema,
  updateSchema,
  buildFilter: (q) => {
    const filter: Record<string, unknown> = {};
    if (q.priority) filter.priority = q.priority;
    if (q.course_id) filter.course_id = q.course_id;
    if (q.scope === "campus") filter.course_id = "";
    if (q.active === "true") filter.expires = { $gte: new Date().toISOString().slice(0, 10) };
    return filter;
  },
});
