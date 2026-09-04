export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

export function FilterTabs({
  value,
  onChange,
  options,
  className = "",
}: {
  value: string;
  onChange: (next: string) => void;
  options: FilterOption[];
  className?: string;
}) {
  return (
    <div
      className={`inline-flex flex-wrap items-center gap-1 rounded-md border border-ink/12 bg-card p-1 ${className}`}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={active}
            className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1.5 text-[13px] font-medium capitalize transition-colors ${
              active
                ? "bg-ink text-paper"
                : "text-muted-foreground hover:bg-paper-deep hover:text-foreground"
            }`}
          >
            {option.label}
            {option.count !== undefined && (
              <span
                className={`tnum rounded px-1 text-[10px] leading-4 font-semibold ${
                  active ? "bg-paper/20 text-paper" : "bg-paper-deep text-muted-foreground"
                }`}
              >
                {option.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
