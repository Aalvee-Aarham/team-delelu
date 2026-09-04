import type { Submission } from "@/lib/types";
import type { Tone } from "@/lib/tone";

export const SUBMISSION_TONE: Record<Submission["status"], Tone> = {
  submitted: "blue",
  accepted: "green",
  rejected: "red",
  returned: "amber",
};

export const SUBMISSION_LABEL: Record<Submission["status"], string> = {
  submitted: "Turned in",
  accepted: "Accepted",
  rejected: "Rejected",
  returned: "Returned for edits",
};

export function daysUntil(deadline: string, today = new Date().toISOString().slice(0, 10)) {
  return Math.round((Date.parse(deadline) - Date.parse(today)) / 86400000);
}

export function deadlineLabel(deadline: string, submitted: boolean) {
  const left = daysUntil(deadline);
  if (submitted) return left < 0 ? "closed" : `${left}d left`;
  if (left < 0) return `${Math.abs(left)}d overdue`;
  if (left === 0) return "due today";
  return `${left}d left`;
}

export function formatBytes(bytes: number) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatMoment(iso: string) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}
