import { useRef, useState } from "react";
import { Paperclip, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AttachmentList } from "@/components/AttachmentList";
import { useFileUpload } from "@/hooks/useUpload";
import type { Attachment } from "@/lib/types";

export function FilePicker({
  attachments,
  onChange,
  maxMb,
  provider,
  disabled,
}: {
  attachments: Attachment[];
  onChange: (next: Attachment[]) => void;
  maxMb: number;
  provider: string;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const { uploading, uploadSubmissionFiles } = useFileUpload();

  const accept = async (fileList: FileList | null) => {
    const files = Array.from(fileList ?? []);
    if (files.length === 0) return;
    const uploaded = await uploadSubmissionFiles(files.slice(0, 5));
    if (uploaded.length > 0) onChange([...attachments, ...uploaded]);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!disabled) void accept(e.dataTransfer.files);
        }}
        className={`flex flex-col items-center rounded-lg border border-dashed px-5 py-7 text-center transition-colors ${
          dragging ? "border-primary bg-primary/5" : "border-ink/25 bg-paper-deep/40"
        } ${disabled ? "opacity-60" : ""}`}
      >
        <span className="grid h-10 w-10 place-items-center rounded-md border border-ink/12 bg-card text-muted-foreground">
          <Upload className="h-4 w-4" />
        </span>
        <p className="mt-3 text-[13px] font-medium">Drop files here, or pick them manually</p>
        <p className="mt-1 text-[12px] text-muted-foreground">
          Images, PDF and documents up to {maxMb} MB each, 5 files per upload. Stored on {provider}.
        </p>

        <input
          ref={inputRef}
          type="file"
          multiple
          hidden
          disabled={disabled || uploading}
          onChange={(e) => void accept(e.target.files)}
          accept="image/*,application/pdf,.doc,.docx,.txt,.md,.zip,.ipynb,.py,.c,.cpp,.java,.l,.arff,.csv"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-4"
          disabled={disabled || uploading}
          onClick={() => inputRef.current?.click()}
        >
          <Paperclip />
          {uploading ? "Uploading…" : "Choose files"}
        </Button>
      </div>

      <AttachmentList
        attachments={attachments}
        onRemove={(index) => onChange(attachments.filter((_, i) => i !== index))}
      />
    </div>
  );
}
