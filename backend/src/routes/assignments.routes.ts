import { z } from "zod";
import { Assignment } from "../models/assignment.model";
import { buildCrudRouter } from "./crud.factory";

const attachmentSchema = z.object({
  url: z.string().min(1),
  name: z.string().min(1),
  mime: z.string().default("application/octet-stream"),
  size: z.number().nonnegative().default(0),
  provider: z.enum(["cloudinary", "uploadthing", "local", "link"]).default("local"),
  kind: z.enum(["image", "pdf", "file"]).default("file"),
});

const createSchema = z.object({
  id: z.string().min(1),
  course_id: z.string().default(""),
  course: z.string().min(1),
  course_title: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  assigned_date: z.string().min(1),
  deadline: z.string().min(1),
  submission_platform: z.string().min(1),
  status: z.enum(["pending", "submitted", "graded", "late"]),
  marks: z.number().nonnegative(),
  attachments: z.array(attachmentSchema).default([]),
  accepts_text: z.boolean().default(true),
  accepts_files: z.boolean().default(true),
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
    if (q.course_id) filter.course_id = q.course_id;
    if (q.courses) {
      const list = String(q.courses).split(",").map((c) => c.trim()).filter(Boolean);
      if (list.length > 0) {
        filter.$or = [{ course_id: { $in: list } }, { course: { $in: list } }];
      }
    }
    if (q.due_before) filter.deadline = { $lte: q.due_before };
    return filter;
  },
});
