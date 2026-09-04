import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { env } from "../config/env";
import { User } from "../models/user.model";
import { AppError } from "../middleware/error";
import { requireAuth, AuthPayload } from "../middleware/auth";

export const authRouter = Router();

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  student_id: z.string().min(1),
  section: z.string().min(1),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function signToken(payload: AuthPayload) {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions);
}

function toPublicUser(user: { student_id: string; name: string; email: string; section: string; role: string }) {
  return {
    student_id: user.student_id,
    name: user.name,
    email: user.email,
    section: user.section,
    role: user.role,
  };
}

authRouter.post("/register", async (req, res, next) => {
  try {
    const body = registerSchema.parse(req.body);
    const existing = await User.findOne({ email: body.email });
    if (existing) {
      throw new AppError(409, "Email already registered");
    }
    const passwordHash = await bcrypt.hash(body.password, 10);
    const user = await User.create({
      name: body.name,
      email: body.email,
      passwordHash,
      student_id: body.student_id,
      section: body.section,
      role: "student",
    });
    const token = signToken({
      userId: user.id,
      student_id: user.student_id,
      name: user.name,
      section: user.section,
      role: user.role,
    });
    res.status(201).json({ token, user: toPublicUser(user) });
  } catch (err) {
    next(err);
  }
});

authRouter.post("/login", async (req, res, next) => {
  try {
    const body = loginSchema.parse(req.body);
    const user = await User.findOne({ email: body.email });
    if (!user) {
      throw new AppError(401, "Invalid email or password");
    }
    const valid = await bcrypt.compare(body.password, user.passwordHash);
    if (!valid) {
      throw new AppError(401, "Invalid email or password");
    }
    const token = signToken({
      userId: user.id,
      student_id: user.student_id,
      name: user.name,
      section: user.section,
      role: user.role,
    });
    res.json({ token, user: toPublicUser(user) });
  } catch (err) {
    next(err);
  }
});

authRouter.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.auth!.userId);
    if (!user) {
      throw new AppError(404, "User not found");
    }
    res.json({ user: toPublicUser(user) });
  } catch (err) {
    next(err);
  }
});
