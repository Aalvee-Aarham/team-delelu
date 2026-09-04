import { env } from "./config/env";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { errorHandler, notFoundHandler } from "./middleware/error";
import { runSeed } from "./seed";
import { authRouter } from "./routes/auth.routes";
import { schedulesRouter } from "./routes/schedules.routes";
import { roomsRouter } from "./routes/rooms.routes";
import { bookingsRouter } from "./routes/bookings.routes";
import { eventsRouter } from "./routes/events.routes";
import { announcementsRouter } from "./routes/announcements.routes";
import { assignmentsRouter } from "./routes/assignments.routes";
import { meRouter } from "./routes/me.routes";
import { agentRouter } from "./routes/agent.routes";
import { streamRouter } from "./routes/stream.routes";

const app = express();

app.use(cors({ origin: env.FRONTEND_URL }));
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRouter);
app.use("/api/schedules", schedulesRouter);
app.use("/api/rooms", roomsRouter);
app.use("/api/bookings", bookingsRouter);
app.use("/api/events", eventsRouter);
app.use("/api/announcements", announcementsRouter);
app.use("/api/assignments", assignmentsRouter);
app.use("/api/me", meRouter);
app.use("/api/agent", agentRouter);
app.use("/api/stream", streamRouter);

app.use(notFoundHandler);
app.use(errorHandler);

async function start() {
  await mongoose.connect(env.MONGODB_URI, { dbName: "campusos" });
  console.log("MongoDB connected");
  await runSeed();
  const server = app.listen(env.PORT, () => {
    console.log(`CampusOS backend listening on port ${env.PORT}`);
  });

  const shutdown = () => {
    server.close(() => {
      mongoose.connection.close(false).finally(() => process.exit(0));
    });
    setTimeout(() => process.exit(0), 3000).unref();
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
