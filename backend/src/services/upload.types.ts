export interface UploadedFile {
  url: string;
  name: string;
  mime: string;
  size: number;
  provider: "cloudinary" | "uploadthing" | "local" | "link";
  kind: "image" | "pdf" | "file";
}

export interface IncomingFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

export function fileKind(mime: string, name: string): UploadedFile["kind"] {
  if (mime.startsWith("image/")) return "image";
  if (mime === "application/pdf" || name.toLowerCase().endsWith(".pdf")) return "pdf";
  return "file";
}

export function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120) || "file";
}
