import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          {eyebrow && <div className="eyebrow mb-2.5 text-muted-foreground">{eyebrow}</div>}
          <h1 className="text-[28px] leading-none font-bold tracking-tight">{title}</h1>
          {subtitle && (
            <p className="mt-3 max-w-xl text-[13px] leading-relaxed text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>
        {action}
      </div>
      <div className="rule-dotted mt-6 h-px w-full" />
    </div>
  );
}
