import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { TONE_CHIP, type Tone } from "@/lib/tone";

export function StatusPill({
  tone = "ink",
  icon: Icon,
  children,
  className = "",
}: {
  tone?: Tone;
  icon?: LucideIcon;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded border px-2 py-0.5 text-[10px] leading-4 font-semibold tracking-[0.09em] uppercase ${TONE_CHIP[tone]} ${className}`}
    >
      {Icon && <Icon className="h-3 w-3" />}
      {children}
    </span>
  );
}
