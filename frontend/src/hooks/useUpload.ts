import { useState } from "react";
import { toast } from "sonner";
import { api, apiErrorMessage } from "@/lib/axios";
import type { Attachment } from "@/lib/types";

export function useFileUpload() {
  const [uploading, setUploading] = useState(false);

  async function uploadSubmissionFiles(files: File[]): Promise<Attachment[]> {
    if (files.length === 0) return [];
    const form = new FormData();
    for (const file of files) form.append("files", file);
    setUploading(true);
    try {
      const res = await api.post<{ files: Attachment[] }>("/uploads/submissions", form);
      return res.data.files;
    } catch (error) {
      toast.error(apiErrorMessage(error));
      return [];
    } finally {
      setUploading(false);
    }
  }

  async function uploadImage(file: File): Promise<Attachment | null> {
    const form = new FormData();
    form.append("file", file);
    setUploading(true);
    try {
      const res = await api.post<{ file: Attachment }>("/uploads/images", form);
      return res.data.file;
    } catch (error) {
      toast.error(apiErrorMessage(error));
      return null;
    } finally {
      setUploading(false);
    }
  }

  return { uploading, uploadSubmissionFiles, uploadImage };
}
