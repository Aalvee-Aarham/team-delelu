import { Link } from "react-router-dom";
import { ArrowDown, ArrowRight, Boxes, Radio, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Crosshair, HalftoneSquare, TickMark } from "@/components/Decor";
import { useTilt } from "@/hooks/useMotion";
import { scrollToSection } from "@/lib/scroll";

const HEADLINE = ["One", "campus.", "One", "truth.", "One", "agent."];

const TRACE = [
  { tool: "list_schedules", detail: "6 records · 88ms" },
  { tool: "list_announcements", detail: "3 records · 63ms" },
];

export function LandingHero() {
  const { ref: cardRef, onPointerMove, onPointerLeave } = useTilt<HTMLDivElement>(6);

  return (
    <section id="top" className="relative overflow-hidden px-5 pt-16 pb-24 lg:px-8 lg:pt-24 lg:pb-32">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <img
          src="/background.png"
          alt=""
          data-parallax="0.12"
          className="absolute inset-0 h-[115%] w-full object-cover opacity-35"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-paper/70 via-paper/88 to-paper" />
        <div data-parallax="-0.18" className="absolute top-24 left-[6%]">
          <HalftoneSquare className="h-28 w-28" />
        </div>
        <div data-parallax="0.22" className="absolute right-[9%] bottom-24">
          <HalftoneSquare className="h-20 w-20" />
        </div>
        <div data-parallax="-0.3" className="absolute top-32 right-[16%]">
          <Crosshair className="h-8 w-8 text-ink/25" />
        </div>
        <div data-parallax="0.26" className="absolute bottom-40 left-[18%]">
          <Crosshair className="h-6 w-6 text-ink/20" />
        </div>
        <div data-parallax="-0.4" className="absolute top-0 right-[22%] h-24 w-1.5 bg-destructive/70" />
        <div data-parallax="0.35" className="absolute bottom-10 left-[42%] h-1.5 w-28 bg-warn/80" />
        <div
          data-parallax="0.5"
          className="absolute top-1/2 left-[4%] h-40 w-40 rounded-full bg-violet/10 blur-3xl"
        />
      </div>

      <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <div
            data-reveal
            className="mb-7 inline-flex items-center gap-2 rounded-full border border-ink/15 bg-card/80 py-1.5 pr-4 pl-1.5 backdrop-blur"
          >
            <span className="grid h-6 w-6 place-items-center rounded-full bg-ink text-paper">
              <Sparkles className="h-3.5 w-3.5" />
            </span>
            <span className="eyebrow text-ink/70">16 typed tools · live MongoDB</span>
          </div>

          <h1 className="text-[46px] leading-[0.98] font-extrabold tracking-tight sm:text-[62px] lg:text-[72px]">
            {HEADLINE.map((word, index) => (
              <span
                key={`${word}-${index}`}
                data-reveal
                style={{ "--reveal-delay": `${90 + index * 70}ms` } as React.CSSProperties}
                className={`mr-[0.22em] inline-block ${index === 5 ? "text-primary" : ""}`}
              >
                {word}
              </span>
            ))}
          </h1>

          <p
            data-reveal
            style={{ "--reveal-delay": "540ms" } as React.CSSProperties}
            className="mt-7 max-w-xl text-[15px] leading-relaxed text-ink/70 sm:text-[16px]"
          >
            CampusOS manages schedules, rooms, events, announcements and assignments in one place —
            then puts an agent on top that reads and acts on that same live data through real
            function calling. Not a chatbot with a copy of the seed file.
          </p>

          <div
            data-reveal
            style={{ "--reveal-delay": "640ms" } as React.CSSProperties}
            className="mt-9 flex flex-wrap items-center gap-3"
          >
            <Button size="lg" variant="primary" className="nudge" render={<Link to="/register" />}>
              Create an account
              <ArrowRight />
            </Button>
            <Button size="lg" variant="outline" onClick={() => scrollToSection("agent")}>
              Watch the agent work
            </Button>
          </div>

          <div
            data-reveal
            style={{ "--reveal-delay": "720ms" } as React.CSSProperties}
            className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-3 text-[12px] text-muted-foreground"
          >
            <span className="flex items-center gap-2">
              <Radio className="h-3.5 w-3.5 text-ok" />
              Server-Sent Events, no refresh
            </span>
            <span className="flex items-center gap-2">
              <Boxes className="h-3.5 w-3.5 text-primary" />
              Five systems, one database
            </span>
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-warn" />
              Groq → Gemini failover
            </span>
          </div>
        </div>

        <div data-reveal="scale" style={{ "--reveal-delay": "300ms" } as React.CSSProperties}>
          <div
            ref={cardRef}
            onPointerMove={onPointerMove}
            onPointerLeave={onPointerLeave}
            className="tilt relative rounded-xl border border-ink/12 bg-card p-5 shadow-[0_30px_70px_-50px_rgba(17,24,39,0.55)]"
          >
            <div className="flex items-center justify-between border-b border-ink/10 pb-3">
              <div className="eyebrow text-muted-foreground">AI Agent</div>
              <div className="flex items-center gap-1.5 text-[11px] text-ok">
                <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-ok" />
                live
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <p className="max-w-[80%] rounded-lg rounded-br-sm bg-ink px-3.5 py-2.5 text-[13px] leading-relaxed text-paper">
                Which labs fit 30 people and have a projector?
              </p>
            </div>

            <div className="mt-4 rounded-lg border border-ink/10 bg-paper/70 p-3.5">
              <p className="text-[13px] leading-relaxed text-ink/85">
                Three labs match — <strong className="font-semibold">7A02</strong> (40 seats, free
                after 13:00), <strong className="font-semibold">4C11</strong> and{" "}
                <strong className="font-semibold">2B08</strong>. All three have a projector.
              </p>
              <div className="mt-3 space-y-1.5 border-t border-dashed border-ink/15 pt-3">
                {TRACE.map(({ tool, detail }) => (
                  <div key={tool} className="flex items-center justify-between gap-3 text-[11px]">
                    <span className="font-mono text-primary">{tool}()</span>
                    <span className="tnum text-muted-foreground">{detail}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Derived from 3 live records</span>
              <span className="font-mono">groq · gpt-oss-120b</span>
            </div>

            <TickMark className="absolute -top-3 right-6 h-3 w-16 text-ink/25" />
          </div>

          <div
            aria-hidden
            className="animate-float mt-4 ml-auto w-fit rounded-lg border border-ink/12 bg-card px-3.5 py-2 text-[11px] text-muted-foreground shadow-sm"
          >
            <span className="font-mono text-violet">create_booking()</span> · 1 written · 118ms
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => scrollToSection("features")}
        className="mx-auto mt-16 flex flex-col items-center gap-2 text-muted-foreground transition-colors hover:text-ink"
      >
        <span className="eyebrow">Scroll</span>
        <ArrowDown className="h-4 w-4 animate-bounce" />
      </button>
    </section>
  );
}