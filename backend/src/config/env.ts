import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const optionalSecret = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
  z.string().min(1).optional()
);

const envSchema = z.object({
  PORT: z.coerce.number().int().positive(),
  NODE_ENV: z.enum(["development", "production", "test"]),
  MONGODB_URI: z.string().min(1),
  JWT_SECRET: z.string().min(1),
  JWT_EXPIRES_IN: z.string().min(1),
  FRONTEND_URL: z.string().url(),
  GROQ_API_KEY_1: z.string().min(1),
  GROQ_API_KEY_2: z.string().min(1),
  GEMINI_API_KEY_1: z.string().min(1),
  GEMINI_API_KEY_2: z.string().min(1),
  LLM_TIMEOUT_MS: z.coerce.number().int().positive().default(12000),
  CLOUDINARY_CLOUD_NAME: optionalSecret,
  CLOUDINARY_API_KEY: optionalSecret,
  CLOUDINARY_API_SECRET: optionalSecret,
  UPLOADTHING_TOKEN: optionalSecret,
  MAX_UPLOAD_MB: z.coerce.number().int().positive().default(16),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const missing = parsed.error.issues.map((i) => i.path.join(".")).join(", ");
  console.error(`Missing or invalid environment variable(s): ${missing}`);
  process.exit(1);
}

export const env = parsed.data;
