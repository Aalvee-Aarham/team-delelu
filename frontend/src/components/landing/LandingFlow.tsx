import { useCallback, useEffect, useState } from "react";
import { TONE_BAR, TONE_TILE } from "@/lib/tone";
import { FLOW_STEPS, type FlowStep } from "@/components/landing/landing.data";
import { SectionHeading } from "@/components/landing/SectionHeading";
import { useInView } from "@/hooks/useMotion";

function Step({
  step,
  position,
  onEnter,
  active,
}: {
  step: FlowStep;
  position: number;
  onEnter: (position: number) => void;
  active: boolean;
}) {
  const { ref, inView } = useInView<HTMLLIElement>(0.55);

  useEffect(() => {
    if (inView) onEnter(position);
  }, [inView, position, onEnter]);

  return (
    <li ref={ref} className="relative pl-16 sm:pl-20">
      <span
        className={`absolute top-0 left-0 grid h-11 w-11 place-items-center rounded-md font-mono text-[13px] font-bold transition-all duration-500 sm:h-14 sm:w-14 sm:text-[15px] ${
          active ? TONE_TILE[step.tone] : "border border-ink/15 bg-card text-ink/35"
        } ${active ? "scale-100" : "scale-95"}`}
      >
        {step.step}
      </span>

      <div
        className={`pb-12 transition-all duration-500 ${active ? "opacity-100" : "opacity-45"}`}
      >
        <h3 className="text-[19px] font-bold tracking-tight sm:text-[22px]">{step.title}</h3>
        <p className="mt-2.5 max-w-xl text-[13.5px] leading-relaxed text-ink/70">{step.copy}</p>
        <span
          className={`mt-4 block h-1 origin-left transition-transform duration-700 ${TONE_BAR[step.tone]} ${
            active ? "scale-x-100" : "scale-x-0"
          }`}
          style={{ width: "72px" }}
        />
      </div>
    </li>
  );
}

export function LandingFlow() {
  const [reached, setReached] = useState(0);

  const onEnter = useCallback(
    (position: number) => setReached((value) => Math.max(value, position + 1)),
    []
  );

  return (
    <section
      id="how"
      className="relative scroll-mt-24 border-y border-ink/12 bg-paper-deep/60 px-5 py-24 lg:px-8"
    >
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="How it works"
          title="From a sentence to a written record."
          copy="Four things happen between your question and the answer, and none of them are guesswork."
        />

        <div className="relative mt-14">
          <span
            aria-hidden
            className="absolute top-2 bottom-2 left-[21px] w-px bg-ink/12 sm:left-[27px]"
          />
          <span
            aria-hidden
            className="absolute top-2 left-[21px] w-px origin-top bg-ink transition-transform duration-700 ease-out sm:left-[27px]"
            style={{
              height: "calc(100% - 1rem)",
              transform: `scaleY(${reached / FLOW_STEPS.length})`,
            }}
          />
          <ol className="relative">
            {FLOW_STEPS.map((step, position) => (
              <Step
                key={step.step}
                step={step}
                position={position}
                onEnter={onEnter}
                active={reached > position}
              />
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
