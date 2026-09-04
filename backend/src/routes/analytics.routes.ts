import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { computeAnalytics } from "../services/analytics.service";

export const analyticsRouter = Router();

analyticsRouter.get("/", requireAuth, async (req, res, next) => {
  try {
    const date = typeof req.query.date === "string" ? req.query.date : undefined;
    res.json(await computeAnalytics(date));
  } catch (err) {
    next(err);
  }
});
