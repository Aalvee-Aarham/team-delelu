import { Router } from "express";
import { z } from "zod";
import { Comment } from "../models/comment.model";
import { requireAuth } from "../middleware/auth";
import { AppError } from "../middleware/error";
import { publishChange } from "../realtime/sse";

export const commentsRouter = Router();

const TARGETS = ["assignment", "announcement", "course", "event", "submission"] as const;

const createSchema = z.object({
  target_type: z.enum(TARGETS),
  target_id: z.string().min(1),
  course_id: z.string().default(""),
  parent_id: z.string().default(""),
  body: z.string().min(1).max(2000),
});

const querySchema = z.object({
  target_type: z.enum(TARGETS).optional(),
  target_id: z.string().optional(),
  course_id: z.string().optional(),
});

commentsRouter.get("/", requireAuth, async (req, res, next) => {
  try {
    const q = querySchema.parse(req.query);
    const filter: Record<string, unknown> = {};
    if (q.target_type) filter.target_type = q.target_type;
    if (q.target_id) filter.target_id = q.target_id;
    if (q.course_id) filter.course_id = q.course_id;
    const docs = await Comment.find(filter).sort({ created_at: 1 }).limit(300);
    res.json(docs);
  } catch (err) {
    next(err);
  }
});

commentsRouter.post("/", requireAuth, async (req, res, next) => {
  try {
    const body = createSchema.parse(req.body);
    if (body.parent_id) {
      const parent = await Comment.findOne({ id: body.parent_id });
      if (!parent) throw new AppError(404, `Parent comment not found: ${body.parent_id}`);
      if (parent.parent_id) throw new AppError(400, "Replies cannot be nested more than one level deep");
    }

    const doc = await Comment.create({
      id: `cmt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      target_type: body.target_type,
      target_id: body.target_id,
      course_id: body.course_id,
      parent_id: body.parent_id,
      author_id: req.auth!.student_id,
      author_name: req.auth!.name,
      author_role: req.auth!.role,
      body: body.body.trim(),
      created_at: new Date().toISOString(),
    });

    publishChange("comments", "create", doc.id);
    res.status(201).json(doc);
  } catch (err) {
    next(err);
  }
});

commentsRouter.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    const doc = await Comment.findOne({ id: req.params.id });
    if (!doc) throw new AppError(404, `Comment not found: ${req.params.id}`);
    if (doc.author_id !== req.auth!.student_id && req.auth!.role !== "admin") {
      throw new AppError(403, "You can only delete your own comment");
    }
    await Comment.deleteMany({ $or: [{ id: doc.id }, { parent_id: doc.id }] });
    publishChange("comments", "delete", doc.id);
    res.json({ deleted: true });
  } catch (err) {
    next(err);
  }
});
