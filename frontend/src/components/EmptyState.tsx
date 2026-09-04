import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-dashed border-ink/25 bg-card/60 px-6 py-14 text-center">
      <span className="grid h-11 w-11 place-items-center rounded-md border border-ink/12 bg-paper-deep text-muted-foreground">
        <Icon className="h-5 w-5" />
      </span>
      <h3 className="mt-4 text-[15px] font-semibold tracking-tight">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
