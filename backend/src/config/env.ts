import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  MONGODB_URI: z.string().min(1),
  JWT_SECRET: z.string().min(1),
  JWT_EXPIRES_IN: z.string().min(1).default("7d"),
  // "*" allows any origin, which is what we want when the API is served from
  // the same domain as the frontend (single Vercel deployment).
  FRONTEND_URL: z.union([z.literal("*"), z.string().url()]).default("*"),
  GROQ_API_KEY_1: z.string().min(1),
  GROQ_API_KEY_2: z.string().min(1),
  GEMINI_API_KEY_1: z.string().min(1),
  GEMINI_API_KEY_2: z.string().min(1),
  LLM_TIMEOUT_MS: z.coerce.number().int().positive().default(12000),
  AWS_ACCESS_KEY_ID: z.string().min(1),
  AWS_SECRET_ACCESS_KEY: z.string().min(1),
  AWS_REGION: z.string().min(1).default("us-east-1"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const missing = parsed.error.issues.map((i) => i.path.join(".")).join(", ");
  throw new Error(`Missing or invalid environment variable(s): ${missing}`);
}

export const env = parsed.data;
