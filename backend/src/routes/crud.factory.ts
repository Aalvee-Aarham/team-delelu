import { Router } from "express";
import { Model } from "mongoose";
import { ZodTypeAny } from "zod";
import { requireAuth, requireAdmin } from "../middleware/auth";
import { AppError } from "../middleware/error";
import { publishChange } from "../realtime/sse";

interface CrudOptions<T> {
  model: Model<T>;
  collectionName: string;
  createSchema: ZodTypeAny;
  updateSchema: ZodTypeAny;
  buildFilter?: (query: Record<string, unknown>) => Record<string, unknown>;
}

export function buildCrudRouter<T extends { id: string }>(opts: CrudOptions<T>) {
  const router = Router();
  const { model, collectionName, createSchema, updateSchema, buildFilter } = opts;

  router.get("/", requireAuth, async (req, res, next) => {
    try {
      const filter = buildFilter ? buildFilter(req.query as Record<string, unknown>) : {};
      const docs = await model.find(filter).sort({ id: 1 });
      res.json(docs);
    } catch (err) {
      next(err);
    }
  });

  router.get("/:id", requireAuth, async (req, res, next) => {
    try {
      const doc = await model.findOne({ id: req.params.id } as Record<string, unknown>);
      if (!doc) throw new AppError(404, `${collectionName} not found: ${req.params.id}`);
      res.json(doc);
    } catch (err) {
      next(err);
    }
  });

  router.post("/", requireAuth, requireAdmin, async (req, res, next) => {
    try {
      const body = createSchema.parse(req.body);
      const doc = await model.create(body);
      publishChange(collectionName, "create", (doc as unknown as T).id);
      res.status(201).json(doc);
    } catch (err) {
      next(err);
    }
  });

  router.patch("/:id", requireAuth, requireAdmin, async (req, res, next) => {
    try {
      const body = updateSchema.parse(req.body);
      const doc = await model.findOneAndUpdate({ id: req.params.id } as Record<string, unknown>, body, { new: true });
      if (!doc) throw new AppError(404, `${collectionName} not found: ${req.params.id}`);
      publishChange(collectionName, "update", req.params.id);
      res.json(doc);
    } catch (err) {
      next(err);
    }
  });

  router.delete("/:id", requireAuth, requireAdmin, async (req, res, next) => {
    try {
      const doc = await model.findOneAndDelete({ id: req.params.id } as Record<string, unknown>);
      if (!doc) throw new AppError(404, `${collectionName} not found: ${req.params.id}`);
      publishChange(collectionName, "delete", req.params.id);
      res.json({ deleted: true });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
