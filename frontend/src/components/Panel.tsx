import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { TONE_TEXT, type Tone } from "@/lib/tone";

interface PanelProps {
  eyebrow?: string;
  title?: ReactNode;
  description?: ReactNode;
  icon?: LucideIcon;
  tone?: Tone;
  action?: ReactNode;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}

export function Panel({
  eyebrow,
  title,
  description,
  icon: Icon,
  tone = "ink",
  action,
  className = "",
  bodyClassName = "p-5",
  children,
}: PanelProps) {
  const hasHeader = Boolean(eyebrow || title || action);

  return (
    <section className={`flex flex-col rounded-lg border border-ink/12 bg-card ${className}`}>
      {hasHeader && (
        <header className="flex items-start justify-between gap-4 border-b border-ink/10 px-5 py-4">
          <div className="min-w-0">
            {eyebrow && (
              <div className="eyebrow flex items-center gap-1.5 text-muted-foreground">
                {Icon && <Icon className={`h-3.5 w-3.5 ${TONE_TEXT[tone]}`} />}
                {eyebrow}
              </div>
            )}
            {title && (
              <h2 className={`text-[15px] font-semibold tracking-tight ${eyebrow ? "mt-2" : ""}`}>
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{description}</p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}
