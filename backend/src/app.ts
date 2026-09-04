import express from "express";
import cors from "cors";
import { env } from "./config/env";
import { errorHandler, notFoundHandler } from "./middleware/error";
import { authRouter } from "./routes/auth.routes";
import { schedulesRouter } from "./routes/schedules.routes";
import { roomsRouter } from "./routes/rooms.routes";
import { bookingsRouter } from "./routes/bookings.routes";
import { eventsRouter } from "./routes/events.routes";
import { announcementsRouter } from "./routes/announcements.routes";
import { assignmentsRouter } from "./routes/assignments.routes";
import { coursesRouter } from "./routes/courses.routes";
import { submissionsRouter } from "./routes/submissions.routes";
import { commentsRouter } from "./routes/comments.routes";
import { uploadsRouter } from "./routes/uploads.routes";
import { meRouter } from "./routes/me.routes";
import { agentRouter } from "./routes/agent.routes";
import { streamRouter } from "./routes/stream.routes";
import { analyticsRouter } from "./routes/analytics.routes";
import { voiceRouter } from "./routes/voice.routes";

export const app = express();

app.use(cors({ origin: env.FRONTEND_URL }));
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRouter);
app.use("/api/schedules", schedulesRouter);
app.use("/api/rooms", roomsRouter);
app.use("/api/bookings", bookingsRouter);
app.use("/api/events", eventsRouter);
app.use("/api/announcements", announcementsRouter);
app.use("/api/assignments", assignmentsRouter);
app.use("/api/courses", coursesRouter);
app.use("/api/submissions", submissionsRouter);
app.use("/api/comments", commentsRouter);
app.use("/api/uploads", uploadsRouter);
app.use("/api/me", meRouter);
app.use("/api/agent", agentRouter);
app.use("/api/stream", streamRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/voice", voiceRouter);

app.use(notFoundHandler);
app.use(errorHandler);
