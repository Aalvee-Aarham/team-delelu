import { Router } from "express";
import { z } from "zod";
import { Course } from "../models/course.model";
import { Assignment } from "../models/assignment.model";
import { Announcement } from "../models/announcement.model";
import { Submission } from "../models/submission.model";
import { buildCrudRouter } from "./crud.factory";
import { requireAuth } from "../middleware/auth";
import { AppError } from "../middleware/error";
import { publishChange } from "../realtime/sse";

const createSchema = z.object({
  id: z.string().min(1),
  code: z.string().min(1),
  title: z.string().min(1),
  description: z.string().default(""),
  section: z.string().default(""),
  instructor: z.string().default("TBA"),
  room: z.string().default(""),
  term: z.string().default(""),
  cover_url: z.string().default(""),
  cover_credit: z.string().default(""),
  accent: z.string().default("blue"),
  enrolled: z.array(z.string()).default([]),
  archived: z.boolean().default(false),
});

const updateSchema = createSchema.partial();

export const coursesRouter: Router = buildCrudRouter({
  model: Course,
  collectionName: "courses",
  createSchema,
  updateSchema,
  buildFilter: (q) => {
    const filter: Record<string, unknown> = {};
    if (q.archived === "true") filter.archived = true;
    if (q.archived === "false") filter.archived = false;
    if (q.code) filter.code = q.code;
    if (q.student_id) filter.enrolled = q.student_id;
    return filter;
  },
});

coursesRouter.get("/:id/stream", requireAuth, async (req, res, next) => {
  try {
    const course = await Course.findOne({ id: req.params.id });
    if (!course) throw new AppError(404, `Course not found: ${req.params.id}`);

    const [assignments, announcements] = await Promise.all([
      Assignment.find({ $or: [{ course_id: course.id }, { course: course.code }] }).sort({ deadline: 1 }),
      Announcement.find({ course_id: course.id }).sort({ date: -1 }),
    ]);

    const isAdmin = req.auth!.role === "admin";
    const submissionFilter = isAdmin
      ? { assignment_id: { $in: assignments.map((a) => a.id) } }
      : { assignment_id: { $in: assignments.map((a) => a.id) }, student_id: req.auth!.student_id };
    const submissions = await Submission.find(submissionFilter).sort({ submitted_at: -1 });

    res.json({ course, assignments, announcements, submissions });
  } catch (err) {
    next(err);
  }
});

coursesRouter.post("/:id/enroll", requireAuth, async (req, res, next) => {
  try {
    const course = await Course.findOne({ id: req.params.id });
    if (!course) throw new AppError(404, `Course not found: ${req.params.id}`);
    if (course.enrolled.includes(req.auth!.student_id)) throw new AppError(409, "Already joined this course");
    course.enrolled.push(req.auth!.student_id);
    await course.save();
    publishChange("courses", "update", course.id);
    res.json(course);
  } catch (err) {
    next(err);
  }
});

coursesRouter.delete("/:id/enroll", requireAuth, async (req, res, next) => {
  try {
    const course = await Course.findOne({ id: req.params.id });
    if (!course) throw new AppError(404, `Course not found: ${req.params.id}`);
    const idx = course.enrolled.indexOf(req.auth!.student_id);
    if (idx === -1) throw new AppError(404, "Not joined to this course");
    course.enrolled.splice(idx, 1);
    await course.save();
    publishChange("courses", "update", course.id);
    res.json(course);
  } catch (err) {
    next(err);
  }
});
