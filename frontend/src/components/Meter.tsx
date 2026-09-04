import { TONE_BAR, type Tone } from "@/lib/tone";

export function Meter({
  label,
  value,
  max,
  tone = "blue",
  caption,
  size = "default",
}: {
  label?: string;
  value: number;
  max: number;
  tone?: Tone;
  caption?: string;
  size?: "default" | "sm";
}) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;

  return (
    <div>
      {(label || caption) && (
        <div className="mb-1.5 flex items-baseline justify-between gap-3">
          {label && (
            <span className="eyebrow truncate text-muted-foreground">{label}</span>
          )}
          {caption && <span className="tnum shrink-0 text-[11px] font-semibold">{caption}</span>}
        </div>
      )}
      <div
        className={`w-full overflow-hidden rounded-full bg-paper-deep ${size === "sm" ? "h-1.5" : "h-2"}`}
      >
        <div
          className={`h-full rounded-full transition-[width] duration-500 ${TONE_BAR[tone]}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export interface Segment {
  label: string;
  value: number;
  tone: Tone;
}

export function StackedMeter({ segments, total }: { segments: Segment[]; total: number }) {
  const safeTotal = total > 0 ? total : 1;

  return (
    <div>
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-paper-deep">
        {segments.map((segment) => (
          <div
            key={segment.label}
            className={`h-full transition-[width] duration-500 ${TONE_BAR[segment.tone]}`}
            style={{ width: `${(segment.value / safeTotal) * 100}%` }}
          />
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5">
        {segments.map((segment) => (
          <span key={segment.label} className="flex items-center gap-1.5 text-[11px]">
            <span className={`h-2 w-2 rounded-full ${TONE_BAR[segment.tone]}`} />
            <span className="tnum font-semibold">{segment.value}</span>
            <span className="text-muted-foreground">{segment.label}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
