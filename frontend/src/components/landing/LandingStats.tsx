import { useCountUp, useInView } from "@/hooks/useMotion";

const STATS = [
  { value: 16, suffix: "", label: "Typed tools", hint: "Query and mutate MongoDB directly" },
  { value: 5, suffix: "", label: "Campus systems", hint: "Full add / edit / delete on each" },
  { value: 2, suffix: "", label: "LLM providers", hint: "Groq primary, Gemini failover" },
  { value: 0, suffix: "", label: "Refreshes needed", hint: "Every tab updates over SSE" },
];

function Stat({
  value,
  suffix,
  label,
  hint,
  delay,
}: {
  value: number;
  suffix: string;
  label: string;
  hint: string;
  delay: number;
}) {
  const { ref, inView } = useInView<HTMLDivElement>(0.5);
  const count = useCountUp(value, inView, 1100 + delay);

  return (
    <div
      ref={ref}
      data-reveal
      style={{ "--reveal-delay": `${delay}ms` } as React.CSSProperties}
      className="lift relative rounded-lg border border-ink/12 bg-card p-5"
    >
      <div className="tnum text-[44px] leading-none font-extrabold tracking-tight">
        {count}
        {suffix}
      </div>
      <div className="eyebrow mt-3.5 text-ink/70">{label}</div>
      <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">{hint}</p>
    </div>
  );
}

export function LandingStats() {
  return (
    <section className="relative px-5 py-20 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map((stat, index) => (
            <Stat key={stat.label} {...stat} delay={index * 90} />
          ))}
        </div>
      </div>
    </section>
  );
}