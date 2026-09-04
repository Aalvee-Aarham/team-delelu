import { STACK } from "@/components/landing/landing.data";

export function LandingMarquee() {
  const items = [...STACK, ...STACK];

  return (
    <div className="marquee-host relative border-y border-ink/12 bg-ink py-3.5 text-paper">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-ink to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-ink to-transparent" />
      <div className="flex w-max">
        <div className="marquee-track flex w-max items-center">
          {items.map((item, index) => (
            <span
              key={`${item}-${index}`}
              className="flex items-center gap-6 px-6 text-[12px] font-medium tracking-wide whitespace-nowrap text-paper/75"
            >
              {item}
              <span className="h-1 w-1 rounded-full bg-warn" />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}