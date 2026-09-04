import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { TONE_TILE, type Tone } from "@/lib/tone";

interface StatTileProps {
  label: string;
  value: ReactNode;
  hint?: string;
  icon: LucideIcon;
  tone?: Tone;
  to?: string;
}

export function StatTile({ label, value, hint, icon: Icon, tone = "ink", to }: StatTileProps) {
  const body = (
    <>
      <span
        className={`grid h-10 w-10 shrink-0 place-items-center rounded-md ${TONE_TILE[tone]}`}
      >
        <Icon className="h-5 w-5" strokeWidth={2} />
      </span>
      <span className="min-w-0">
        <span className="eyebrow block text-muted-foreground">{label}</span>
        <span className="tnum mt-1.5 block text-3xl leading-none font-bold tracking-tight">
          {value}
        </span>
        {hint && (
          <span className="mt-2 block text-[11px] leading-tight text-muted-foreground">{hint}</span>
        )}
      </span>
    </>
  );

  const shell =
    "flex items-start gap-3.5 rounded-lg border border-ink/12 bg-card p-4 text-left transition-colors";

  if (!to) return <div className={shell}>{body}</div>;

  return (
    <Link to={to} className={`${shell} hover:border-ink/35 hover:bg-paper-deep/40`}>
      {body}
    </Link>
  );
}
