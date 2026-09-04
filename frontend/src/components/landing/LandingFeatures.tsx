import { Check } from "lucide-react";
import { TONE_TEXT, TONE_TILE } from "@/lib/tone";
import { FEATURES, type Feature } from "@/components/landing/landing.data";
import { SectionHeading } from "@/components/landing/SectionHeading";
import { HalftoneSquare } from "@/components/Decor";

function FeatureCard({ feature, delay }: { feature: Feature; delay: number }) {
  const { icon: Icon, tone, title, copy, points } = feature;

  return (
    <article
      data-reveal
      style={{ "--reveal-delay": `${delay}ms` } as React.CSSProperties}
      className={`lift wipe group relative overflow-hidden rounded-lg border border-ink/12 bg-card p-6 hover:border-ink/30 ${TONE_TEXT[tone]}`}
    >
      <span
        className={`grid h-11 w-11 place-items-center rounded-md transition-transform duration-500 group-hover:scale-105 group-hover:-rotate-3 ${TONE_TILE[tone]}`}
      >
        <Icon className="h-5 w-5" strokeWidth={2} />
      </span>

      <h3 className="mt-5 text-[18px] font-bold tracking-tight text-ink">{title}</h3>
      <p className="mt-2.5 text-[13px] leading-relaxed text-ink/65">{copy}</p>

      <ul className="mt-5 space-y-2 border-t border-dashed border-ink/12 pt-4">
        {points.map((point, index) => (
          <li
            key={point}
            style={{ transitionDelay: `${index * 60}ms` }}
            className="flex items-start gap-2 text-[12px] leading-relaxed text-muted-foreground transition-all duration-500 group-hover:translate-x-0.5 group-hover:text-ink/75"
          >
            <Check className="mt-px h-3.5 w-3.5 shrink-0" />
            {point}
          </li>
        ))}
      </ul>
    </article>
  );
}

export function LandingFeatures() {
  return (
    <section id="features" className="relative scroll-mt-24 px-5 py-24 lg:px-8">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div data-parallax="0.14" className="absolute top-10 right-[6%]">
          <HalftoneSquare className="h-24 w-24" />
        </div>
        <div data-parallax="-0.2" className="absolute bottom-24 left-[3%] h-1.5 w-20 bg-primary/60" />
      </div>

      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="What it manages"
          title={
            <>
              Five systems that share
              <br className="hidden sm:block" /> one source of truth.
            </>
          }
          copy="Every record the dashboard writes is a record the agent can read, in the same request. Change one in a tab and the other half already knows."
        />

        <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, index) => (
            <FeatureCard key={feature.title} feature={feature} delay={index * 70} />
          ))}
        </div>
      </div>
    </section>
  );
}