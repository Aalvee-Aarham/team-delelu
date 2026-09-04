import { z } from "zod";
import { Schedule } from "../models/schedule.model";
import { buildCrudRouter } from "./crud.factory";

const createSchema = z.object({
  id: z.string().min(1),
  course: z.string().min(1),
  title: z.string().min(1),
  day: z.enum(["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"]),
  start_time: z.string().regex(/^\d{2}:\d{2}$/),
  end_time: z.string().regex(/^\d{2}:\d{2}$/),
  room: z.string().min(1),
  instructor: z.string().min(1),
  section: z.string().min(1),
});

const updateSchema = createSchema.partial();

export const schedulesRouter = buildCrudRouter({
  model: Schedule,
  collectionName: "schedules",
  createSchema,
  updateSchema,
  buildFilter: (q) => {
    const filter: Record<string, unknown> = {};
    if (q.day) filter.day = q.day;
    if (q.course) filter.course = q.course;
    if (q.section) filter.section = q.section;
    return filter;
  },
});
