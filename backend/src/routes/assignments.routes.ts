import { z } from "zod";
import { Assignment } from "../models/assignment.model";
import { buildCrudRouter } from "./crud.factory";

const createSchema = z.object({
  id: z.string().min(1),
  course: z.string().min(1),
  course_title: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  assigned_date: z.string().min(1),
  deadline: z.string().min(1),
  submission_platform: z.string().min(1),
  status: z.enum(["pending", "submitted", "graded", "late"]),
  marks: z.number().nonnegative(),
});

const updateSchema = createSchema.partial();

export const assignmentsRouter = buildCrudRouter({
  model: Assignment,
  collectionName: "assignments",
  createSchema,
  updateSchema,
  buildFilter: (q) => {
    const filter: Record<string, unknown> = {};
    if (q.status) filter.status = q.status;
    if (q.course) filter.course = q.course;
    if (q.due_before) filter.deadline = { $lte: q.due_before };
    return filter;
  },
});
