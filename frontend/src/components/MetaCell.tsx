import type { LucideIcon } from "lucide-react";

export function MetaCell({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
}) {
  return (
    <div className="min-w-0">
      <div className="eyebrow mb-1.5 flex items-center gap-1.5 text-muted-foreground">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <div className="truncate text-[13px] font-medium">{value}</div>
    </div>
  );
}
