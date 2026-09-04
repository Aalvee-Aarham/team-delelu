import crypto from "crypto";
import fs from "fs";
import path from "path";
import { env } from "../config/env";
import { AppError } from "../middleware/error";
import { IncomingFile, UploadedFile, fileKind, safeName } from "./upload.types";

const LOCAL_DIR = path.join(__dirname, "..", "..", "uploads");

export function cloudinaryConfigured() {
  return Boolean(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET);
}

function signature(params: Record<string, string>) {
  const base = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return crypto.createHash("sha1").update(base + env.CLOUDINARY_API_SECRET).digest("hex");
}

async function uploadToCloudinary(file: IncomingFile, folder: string): Promise<UploadedFile> {
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signed = { folder, timestamp };
  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(file.buffer)], { type: file.mimetype }), safeName(file.originalname));
  form.append("api_key", env.CLOUDINARY_API_KEY!);
  form.append("folder", folder);
  form.append("timestamp", timestamp);
  form.append("signature", signature(signed));

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/auto/upload`,
    { method: "POST", body: form }
  );
  const body = (await res.json()) as { secure_url?: string; bytes?: number; error?: { message: string } };
  if (!res.ok || !body.secure_url) {
    throw new AppError(502, `Cloudinary upload failed: ${body.error?.message ?? res.statusText}`);
  }
  return {
    url: body.secure_url,
    name: file.originalname,
    mime: file.mimetype,
    size: body.bytes ?? file.size,
    provider: "cloudinary",
    kind: fileKind(file.mimetype, file.originalname),
  };
}

function uploadToDisk(file: IncomingFile, folder: string): UploadedFile {
  fs.mkdirSync(LOCAL_DIR, { recursive: true });
  const prefix = folder.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "");
  const stored = `${prefix}-${Date.now()}-${crypto.randomBytes(4).toString("hex")}-${safeName(file.originalname)}`;
  fs.writeFileSync(path.join(LOCAL_DIR, stored), file.buffer);
  return {
    url: `/api/uploads/files/${stored}`,
    name: file.originalname,
    mime: file.mimetype,
    size: file.size,
    provider: "local",
    kind: fileKind(file.mimetype, file.originalname),
  };
}

export async function storeFile(file: IncomingFile, folder: string): Promise<UploadedFile> {
  if (cloudinaryConfigured()) return uploadToCloudinary(file, folder);
  return uploadToDisk(file, folder);
}

export function localUploadDir() {
  return LOCAL_DIR;
}
