import { UTApi } from "uploadthing/server";
import { env } from "../config/env";
import { AppError } from "../middleware/error";
import { IncomingFile, UploadedFile, fileKind, safeName } from "./upload.types";
import { storeFile } from "./cloudinary.service";

let client: UTApi | null = null;

export function uploadThingConfigured() {
  return Boolean(env.UPLOADTHING_TOKEN);
}

function api() {
  if (!client) client = new UTApi({ token: env.UPLOADTHING_TOKEN });
  return client;
}

export async function storeImage(file: IncomingFile, folder: string): Promise<UploadedFile> {
  if (!uploadThingConfigured()) return storeFile(file, folder);

  const payload = new File([new Uint8Array(file.buffer)], safeName(file.originalname), {
    type: file.mimetype,
  });
  const result = await api().uploadFiles(payload);
  if (result.error || !result.data) {
    throw new AppError(502, `UploadThing upload failed: ${result.error?.message ?? "unknown error"}`);
  }
  return {
    url: result.data.ufsUrl,
    name: file.originalname,
    mime: file.mimetype,
    size: result.data.size ?? file.size,
    provider: "uploadthing",
    kind: fileKind(file.mimetype, file.originalname),
  };
}
