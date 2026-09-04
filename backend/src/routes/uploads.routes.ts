import { Router } from "express";
import multer from "multer";
import express from "express";
import { env } from "../config/env";
import { requireAuth, requireAdmin } from "../middleware/auth";
import { AppError } from "../middleware/error";
import { storeFile, cloudinaryConfigured, localUploadDir } from "../services/cloudinary.service";
import { storeImage, uploadThingConfigured } from "../services/uploadthing.service";

export const uploadsRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_UPLOAD_MB * 1024 * 1024, files: 5 },
});

uploadsRouter.use("/files", express.static(localUploadDir(), { maxAge: "1h" }));

uploadsRouter.get("/config", requireAuth, (req, res) => {
  res.json({
    submissions: cloudinaryConfigured() ? "cloudinary" : "local",
    images: uploadThingConfigured() ? "uploadthing" : "local",
    maxMb: env.MAX_UPLOAD_MB,
  });
});

uploadsRouter.post("/submissions", requireAuth, upload.array("files", 5), async (req, res, next) => {
  try {
    const files = (req.files as Express.Multer.File[] | undefined) ?? [];
    if (files.length === 0) throw new AppError(400, "No files received under field name 'files'");
    const stored = [];
    for (const file of files) {
      stored.push(await storeFile(file, "campusos/submissions"));
    }
    res.status(201).json({ files: stored });
  } catch (err) {
    next(err);
  }
});

uploadsRouter.post("/images", requireAuth, requireAdmin, upload.single("file"), async (req, res, next) => {
  try {
    const file = req.file;
    if (!file) throw new AppError(400, "No file received under field name 'file'");
    if (!file.mimetype.startsWith("image/")) throw new AppError(400, "Only image files are allowed here");
    const stored = await storeImage(file, "campusos/images");
    res.status(201).json({ file: stored });
  } catch (err) {
    next(err);
  }
});
