import { Router } from "express";
import type { Request } from "express";
import { z } from "zod";
import { Submission } from "../models/submission.model";
import { Assignment } from "../models/assignment.model";
import { requireAuth, requireAdmin } from "../middleware/auth";
import { AppError } from "../middleware/error";
import { publishChange } from "../realtime/sse";

export const submissionsRouter = Router();

const attachmentSchema = z.object({
  url: z.string().min(1),
  name: z.string().min(1),
  mime: z.string().default("application/octet-stream"),
  size: z.number().nonnegative().default(0),
  provider: z.enum(["cloudinary", "uploadthing", "local", "link"]).default("local"),
  kind: z.enum(["image", "pdf", "file"]).default("file"),
});

const submitSchema = z.object({
  assignment_id: z.string().min(1),
  text: z.string().default(""),
  attachments: z.array(attachmentSchema).default([]),
});

const reviewSchema = z.object({
  status: z.enum(["submitted", "accepted", "rejected", "returned"]),
  grade: z.number().nonnegative().nullable().optional(),
  feedback: z.string().default(""),
});

function scope(req: Request) {
  return req.auth!.role === "admin" ? {} : { student_id: req.auth!.student_id };
}

submissionsRouter.get("/", requireAuth, async (req, res, next) => {
  try {
    const filter: Record<string, unknown> = { ...scope(req) };
    if (req.query.assignment_id) filter.assignment_id = req.query.assignment_id;
    if (req.query.course_id) filter.course_id = req.query.course_id;
    if (req.query.status) filter.status = req.query.status;
    const docs = await Submission.find(filter).sort({ submitted_at: -1 });
    res.json(docs);
  } catch (err) {
    next(err);
  }
});

submissionsRouter.get("/:id", requireAuth, async (req, res, next) => {
  try {
    const doc = await Submission.findOne({ id: req.params.id, ...scope(req) });
    if (!doc) throw new AppError(404, `Submission not found: ${req.params.id}`);
    res.json(doc);
  } catch (err) {
    next(err);
  }
});

submissionsRouter.post("/", requireAuth, async (req, res, next) => {
  try {
    if (req.auth!.role === "admin") throw new AppError(403, "Admins review submissions, they do not create them");
    const body = submitSchema.parse(req.body);
    if (!body.text.trim() && body.attachments.length === 0) {
      throw new AppError(400, "A submission needs either an answer or at least one attachment");
    }

    const assignment = await Assignment.findOne({ id: body.assignment_id });
    if (!assignment) throw new AppError(404, `Assignment not found: ${body.assignment_id}`);

    const now = new Date();
    const submitted_at = now.toISOString();
    const late = submitted_at.slice(0, 10) > assignment.deadline;
    const existing = await Submission.findOne({
      assignment_id: assignment.id,
      student_id: req.auth!.student_id,
    });

    if (existing && (existing.status === "accepted" || existing.status === "rejected")) {
      throw new AppError(409, "This submission has already been reviewed and can no longer be changed");
    }

    const payload = {
      id: existing?.id ?? `sub-${assignment.id}-${req.auth!.student_id}`.replace(/\s+/g, ""),
      assignment_id: assignment.id,
      assignment_title: assignment.title,
      course_id: assignment.course_id,
      course_code: assignment.course,
      student_id: req.auth!.student_id,
      student_name: req.auth!.name,
      text: body.text,
      attachments: body.attachments,
      submitted_at,
      late,
      status: "submitted" as const,
      grade: null,
      feedback: "",
      reviewed_by: "",
      reviewed_at: "",
    };

    const doc = await Submission.findOneAndUpdate(
      { assignment_id: assignment.id, student_id: req.auth!.student_id },
      payload,
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    publishChange("submissions", existing ? "update" : "create", doc.id);
    res.status(existing ? 200 : 201).json(doc);
  } catch (err) {
    next(err);
  }
});

submissionsRouter.patch("/:id/review", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const body = reviewSchema.parse(req.body);
    const submission = await Submission.findOne({ id: req.params.id });
    if (!submission) throw new AppError(404, `Submission not found: ${req.params.id}`);

    const assignment = await Assignment.findOne({ id: submission.assignment_id });
    if (assignment && body.grade != null && body.grade > assignment.marks) {
      throw new AppError(400, `Grade cannot exceed the assignment total of ${assignment.marks}`);
    }

    submission.status = body.status;
    submission.grade = body.grade ?? null;
    submission.feedback = body.feedback;
    submission.reviewed_by = req.auth!.name;
    submission.reviewed_at = new Date().toISOString();
    await submission.save();

    publishChange("submissions", "update", submission.id);
    res.json(submission);
  } catch (err) {
    next(err);
  }
});

submissionsRouter.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    const doc = await Submission.findOne({ id: req.params.id });
    if (!doc) throw new AppError(404, `Submission not found: ${req.params.id}`);
    const isOwner = doc.student_id === req.auth!.student_id;
    if (!isOwner && req.auth!.role !== "admin") throw new AppError(403, "You can only withdraw your own submission");
    if (isOwner && req.auth!.role !== "admin" && doc.status !== "submitted") {
      throw new AppError(409, "A reviewed submission can no longer be withdrawn");
    }
    await doc.deleteOne();
    publishChange("submissions", "delete", doc.id);
    res.json({ deleted: true });
  } catch (err) {
    next(err);
  }
});
