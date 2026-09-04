export function Crosshair({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" aria-hidden className={className}>
      <path d="M20 0v40M0 20h40" stroke="currentColor" strokeWidth="1" />
      <circle cx="20" cy="20" r="6" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

export function TickMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 12" fill="none" aria-hidden className={className}>
      <path d="M0 6h48" stroke="currentColor" strokeWidth="1" />
      <path d="M12 0v12M36 0v12" stroke="currentColor" strokeWidth="1" />
      <circle cx="24" cy="6" r="2.5" fill="currentColor" />
    </svg>
  );
}

export function HalftoneSquare({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`halftone ${className}`} />;
}

export function PaperBackdrop() {
  return (
    <div aria-hidden className="grain pointer-events-none fixed inset-0 -z-10 bg-paper">
      <Crosshair className="absolute top-24 left-[22%] h-7 w-7 text-ink/20" />
      <Crosshair className="absolute right-[14%] bottom-28 h-6 w-6 text-ink/15" />
      <TickMark className="absolute top-10 right-[26%] h-3 w-16 text-ink/15" />
      <HalftoneSquare className="absolute bottom-16 left-10 h-24 w-24" />
      <HalftoneSquare className="absolute top-1/3 right-6 h-16 w-16" />
      <div className="absolute top-0 right-[8%] h-20 w-1.5 bg-destructive/70" />
      <div className="absolute bottom-0 left-[38%] h-1.5 w-24 bg-warn/80" />
    </div>
  );
}
