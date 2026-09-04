import { FileText, ImageIcon, Paperclip, X } from "lucide-react";
import type { Attachment } from "@/lib/types";
import { formatBytes } from "@/lib/classroom.utils";

const ICON = { image: ImageIcon, pdf: FileText, file: Paperclip };

export function AttachmentList({
  attachments,
  onRemove,
  compact = false,
}: {
  attachments: Attachment[];
  onRemove?: (index: number) => void;
  compact?: boolean;
}) {
  if (attachments.length === 0) return null;

  return (
    <ul className={`grid gap-2 ${compact ? "" : "sm:grid-cols-2"}`}>
      {attachments.map((file, index) => {
        const Icon = ICON[file.kind];
        return (
          <li
            key={`${file.url}-${index}`}
            className="flex items-center gap-3 rounded-md border border-ink/12 bg-paper-deep/45 p-2"
          >
            {file.kind === "image" ? (
              <img
                src={file.url}
                alt={file.name}
                loading="lazy"
                className="h-10 w-10 shrink-0 rounded object-cover"
              />
            ) : (
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded border border-ink/12 bg-card text-muted-foreground">
                <Icon className="h-4 w-4" />
              </span>
            )}

            <div className="min-w-0 flex-1">
              <a
                href={file.url}
                target="_blank"
                rel="noreferrer"
                className="block truncate text-[13px] font-medium hover:underline"
              >
                {file.name}
              </a>
              <div className="eyebrow mt-0.5 text-muted-foreground">
                {file.kind}
                {file.size ? ` · ${formatBytes(file.size)}` : ""} · {file.provider}
              </div>
            </div>

            {onRemove && (
              <button
                type="button"
                aria-label={`Remove ${file.name}`}
                onClick={() => onRemove(index)}
                className="grid h-7 w-7 shrink-0 place-items-center rounded text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
