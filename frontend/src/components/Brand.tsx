export function BrandMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden className={className}>
      <rect width="32" height="32" rx="7" fill="#111827" />
      <path d="M7 25a10 10 0 0 1 10-10v10H7Z" fill="#8B5CF6" />
      <rect x="18.5" y="6.5" width="7" height="7" fill="#F5B60B" />
      <rect x="7" y="6.5" width="7.5" height="3" fill="#2563EB" />
    </svg>
  );
}

export function Brand({
  size = "default",
  tagline = false,
}: {
  size?: "default" | "lg";
  tagline?: boolean;
}) {
  const large = size === "lg";
  return (
    <div className="flex items-center gap-3">
      <BrandMark className={large ? "h-11 w-11" : "h-8 w-8"} />
      <div className="min-w-0">
        <div
          className={`font-extrabold tracking-tight ${large ? "text-2xl" : "text-[17px]"} leading-none`}
        >
          CampusOS
        </div>
        {tagline && (
          <div className="eyebrow mt-1.5 text-muted-foreground">Your campus, smarter together</div>
        )}
      </div>
    </div>
  );
}
