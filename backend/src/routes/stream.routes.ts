import { Router } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { AppError } from "../middleware/error";
import { addClient, removeClient } from "../realtime/sse";

export const streamRouter = Router();

streamRouter.get("/", (req, res, next) => {
  const token = typeof req.query.token === "string" ? req.query.token : req.headers.authorization?.replace("Bearer ", "");
  if (!token) {
    next(new AppError(401, "Missing token"));
    return;
  }
  try {
    jwt.verify(token, env.JWT_SECRET);
  } catch {
    next(new AppError(401, "Invalid or expired token"));
    return;
  }

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  res.write(": connected\n\n");
  addClient(res);

  const heartbeat = setInterval(() => res.write(": ping\n\n"), 25000);

  req.on("close", () => {
    clearInterval(heartbeat);
    removeClient(res);
  });
});
