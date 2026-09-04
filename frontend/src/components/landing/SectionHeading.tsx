import type { ReactNode } from "react";
import { TickMark } from "@/components/Decor";

export function SectionHeading({
  eyebrow,
  title,
  copy,
  align = "left",
}: {
  eyebrow: string;
  title: ReactNode;
  copy?: string;
  align?: "left" | "center";
}) {
  const centred = align === "center";

  return (
    <div className={`max-w-2xl ${centred ? "mx-auto text-center" : ""}`}>
      <div
        data-reveal
        className={`flex items-center gap-3 ${centred ? "justify-center" : ""}`}
      >
        <TickMark className="h-3 w-12 text-ink/35" />
        <span className="eyebrow text-muted-foreground">{eyebrow}</span>
      </div>
      <h2
        data-reveal
        style={{ "--reveal-delay": "80ms" } as React.CSSProperties}
        className="mt-5 text-[32px] leading-[1.08] font-extrabold tracking-tight sm:text-[40px]"
      >
        {title}
      </h2>
      {copy && (
        <p
          data-reveal
          style={{ "--reveal-delay": "150ms" } as React.CSSProperties}
          className="mt-4 text-[15px] leading-relaxed text-ink/70"
        >
          {copy}
        </p>
      )}
    </div>
  );
}