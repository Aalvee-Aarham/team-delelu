import { useEffect, useState } from "react";
import { Check, LoaderCircle, Pencil, RadioTower, RotateCcw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/landing/SectionHeading";
import { Crosshair } from "@/components/Decor";

type Phase = "fresh" | "stale" | "resolving" | "resolved";

const ORIGINAL_ROOM = "3B14";
const NEW_ROOM = "7A02";

export function LandingLiveTruth() {
  const [phase, setPhase] = useState<Phase>("fresh");
  const [pulse, setPulse] = useState(false);
  const room = phase === "fresh" ? ORIGINAL_ROOM : NEW_ROOM;

  useEffect(() => {
    if (phase !== "resolving") return;
    const timer = window.setTimeout(() => setPhase("resolved"), 1000);
    return () => window.clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    if (!pulse) return;
    const timer = window.setTimeout(() => setPulse(false), 1400);
    return () => window.clearTimeout(timer);
  }, [pulse]);

  const edit = () => {
    setPulse(true);
    setPhase("stale");
  };

  const stale = phase === "stale" || phase === "resolving";

  return (
    <section id="live" className="relative scroll-mt-24 px-5 py-24 lg:px-8">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div data-parallax="-0.16" className="absolute top-16 left-[8%]">
          <Crosshair className="h-8 w-8 text-ink/15" />
        </div>
        <div data-parallax="0.24" className="absolute right-[10%] bottom-16 h-24 w-1.5 bg-violet/50" />
      </div>

      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Live truth"
          title="Watch an answer go stale in real time."
          copy="Every answer records which records it was derived from. Edit one of them anywhere else and the reply already on screen strikes itself through and offers to re-resolve. Try it — the button on the right is the other tab."
        />

        <div className="mt-12 grid gap-4 lg:grid-cols-2">
          <div
            data-reveal="left"
            className="relative overflow-hidden rounded-xl border border-ink/12 bg-card p-5"
          >
            <div className="flex items-center justify-between border-b border-ink/10 pb-3">
              <span className="eyebrow text-muted-foreground">Tab 1 · AI Agent</span>
              <span
                className={`flex items-center gap-1.5 text-[11px] transition-colors duration-300 ${
                  pulse ? "text-ok" : "text-muted-foreground"
                }`}
              >
                <RadioTower className={`h-3.5 w-3.5 ${pulse ? "animate-pulse-dot" : ""}`} />
                {pulse ? "SSE event received" : "connected"}
              </span>
            </div>

            <div className="mt-4 flex justify-end">
              <p className="max-w-[80%] rounded-lg rounded-br-sm bg-ink px-3.5 py-2.5 text-[13px] leading-relaxed text-paper">
                Where is my Machine Learning class?
              </p>
            </div>

            <div
              className={`mt-4 rounded-lg border p-4 transition-all duration-500 ${
                stale ? "border-destructive/35 bg-destructive/5" : "border-ink/10 bg-paper/70"
              }`}
            >
              <p
                className={`text-[13.5px] leading-relaxed transition-all duration-500 ${
                  stale ? "text-ink/40 line-through decoration-destructive/60" : "text-ink/85"
                }`}
              >
                CSE 4113 — Machine Learning meets Monday 11:00 in Room{" "}
                <strong className="font-semibold">
                  {phase === "resolved" ? NEW_ROOM : ORIGINAL_ROOM}
                </strong>
                , Building 3.
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-dashed border-ink/15 pt-3">
                <span className="eyebrow mr-1 text-muted-foreground">Derived from</span>
                {["schedule#4113", "room#3B14", "announcement#12"].map((chip) => (
                  <span
                    key={chip}
                    className={`rounded border px-1.5 py-0.5 font-mono text-[10.5px] transition-colors duration-500 ${
                      stale && chip === "room#3B14"
                        ? "border-destructive/40 bg-destructive/10 text-[#b91c1c]"
                        : "border-ink/15 bg-paper text-muted-foreground"
                    }`}
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </div>

            <div
              className={`grid transition-all duration-500 ${
                phase === "fresh" ? "grid-rows-[0fr] opacity-0" : "mt-3 grid-rows-[1fr] opacity-100"
              }`}
            >
              <div className="overflow-hidden">
                {phase === "resolved" ? (
                  <div className="flex items-center gap-2 rounded-md border border-ok/35 bg-ok/8 px-3 py-2.5 text-[12px] text-[#15803d]">
                    <Check className="h-3.5 w-3.5" />
                    Re-resolved against the current records.
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-destructive/30 bg-destructive/8 px-3 py-2.5">
                    <span className="flex items-center gap-2 text-[12px] text-[#b91c1c]">
                      <TriangleAlert className="h-3.5 w-3.5" />
                      A record behind this answer changed.
                    </span>
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => setPhase("resolving")}
                      disabled={phase === "resolving"}
                    >
                      {phase === "resolving" ? (
                        <>
                          <LoaderCircle className="animate-spin" />
                          Re-resolving
                        </>
                      ) : (
                        "Re-resolve"
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div
            data-reveal="right"
            style={{ "--reveal-delay": "120ms" } as React.CSSProperties}
            className="relative overflow-hidden rounded-xl border border-ink/12 bg-card p-5"
          >
            <div className="flex items-center justify-between border-b border-ink/10 pb-3">
              <span className="eyebrow text-muted-foreground">Tab 2 · Schedules</span>
              <span className="eyebrow text-muted-foreground">admin@campusos.edu</span>
            </div>

            <div className="mt-4 overflow-hidden rounded-md border border-ink/12">
              <div className="grid grid-cols-[1.4fr_1fr_0.8fr] bg-paper-deep/70 px-3 py-2 text-[11px] font-semibold text-muted-foreground">
                <span>Course</span>
                <span>Room</span>
                <span>Time</span>
              </div>
              <div className="grid grid-cols-[1.4fr_1fr_0.8fr] items-center border-t border-ink/10 px-3 py-3 text-[12.5px]">
                <span className="font-medium">CSE 4113</span>
                <span
                  className={`tnum font-mono transition-all duration-500 ${
                    phase === "fresh" ? "text-ink" : "text-primary"
                  }`}
                >
                  {room}
                </span>
                <span className="tnum text-muted-foreground">11:00</span>
              </div>
              <div className="grid grid-cols-[1.4fr_1fr_0.8fr] items-center border-t border-ink/10 px-3 py-3 text-[12.5px] text-muted-foreground">
                <span>CSE 4207</span>
                <span className="font-mono">2B08</span>
                <span className="tnum">14:00</span>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Button size="sm" onClick={edit} disabled={phase !== "fresh"} className="nudge">
                <Pencil />
                Move the class to {NEW_ROOM}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setPhase("fresh")}
                disabled={phase === "fresh"}
              >
                <RotateCcw />
                Reset
              </Button>
            </div>

            <p className="mt-4 text-[12px] leading-relaxed text-muted-foreground">
              In the real app this write goes to MongoDB and is pushed to every open tab over
              Server-Sent Events. Nothing polls, nothing refreshes, and a reload keeps the change.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}