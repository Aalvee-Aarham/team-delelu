import { useEffect, useState } from "react";
import { CornerDownLeft, LoaderCircle, RotateCcw, Sparkles, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInView, useTypewriter } from "@/hooks/useMotion";
import { DEMO_SCRIPTS } from "@/components/landing/landing.data";
import { SectionHeading } from "@/components/landing/SectionHeading";

export function LandingAgentDemo() {
  const { ref, inView } = useInView<HTMLDivElement>(0.3);
  const [index, setIndex] = useState(0);
  const [run, setRun] = useState(0);
  const [stage, setStage] = useState(0);

  const script = DEMO_SCRIPTS[index];
  const toolCount = script.tools.length;

  useEffect(() => {
    if (!inView) return;
    setStage(0);
    const timers: number[] = [];
    let elapsed = 520;
    script.tools.forEach((tool, position) => {
      timers.push(window.setTimeout(() => setStage(position + 1), elapsed));
      elapsed += 340 + tool.ms * 1.6;
    });
    timers.push(window.setTimeout(() => setStage(toolCount + 1), elapsed + 260));
    return () => timers.forEach(window.clearTimeout);
  }, [script, toolCount, inView, run]);

  const answering = stage > toolCount;
  const { typed, done } = useTypewriter(script.answer, answering);
  const total = script.tools.reduce((sum, tool) => sum + tool.ms, 0);

  return (
    <section id="agent" className="relative scroll-mt-24 border-y border-ink/12 bg-paper-deep/60 px-5 py-24 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="The agent"
          title="Glass box, not black box."
          copy="Every reply expands to show the tool calls behind it — arguments, rows returned, latency, and which provider served the turn. Pick a question and watch it resolve."
        />

        <div className="mt-10 flex flex-wrap gap-2" data-reveal>
          {DEMO_SCRIPTS.map((item, position) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setIndex(position);
                setRun((value) => value + 1);
              }}
              data-active={position === index}
              className="rounded-full border border-ink/15 bg-card px-4 py-2 text-[12.5px] font-medium text-ink/70 transition-all duration-300 hover:-translate-y-px hover:border-ink/40 hover:text-ink data-[active=true]:border-ink data-[active=true]:bg-ink data-[active=true]:text-paper"
            >
              {item.chip}
            </button>
          ))}
        </div>

        <div
          ref={ref}
          data-reveal="scale"
          className="mt-6 grid gap-4 lg:grid-cols-[1.05fr_0.95fr]"
        >
          <div className="rounded-xl border border-ink/12 bg-card p-5">
            <div className="flex items-center justify-between border-b border-ink/10 pb-3">
              <div className="eyebrow flex items-center gap-2 text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-violet" />
                Conversation
              </div>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => setRun((value) => value + 1)}
                className="text-muted-foreground"
              >
                <RotateCcw />
                Replay
              </Button>
            </div>

            <div className="mt-4 flex justify-end">
              <p className="max-w-[85%] rounded-lg rounded-br-sm bg-ink px-3.5 py-2.5 text-[13px] leading-relaxed text-paper">
                {script.question}
              </p>
            </div>

            <div className="mt-4 min-h-[132px] rounded-lg border border-ink/10 bg-paper/70 p-4">
              {answering ? (
                <p
                  className={`text-[13.5px] leading-relaxed text-ink/85 ${done ? "" : "caret"}`}
                >
                  {typed}
                </p>
              ) : (
                <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
                  <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                  {stage === 0 ? "Reading your context…" : `Calling ${script.tools[stage - 1].name}…`}
                </div>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${done ? "bg-ok" : "animate-pulse-dot bg-warn"}`}
                />
                {done ? `Answered from ${toolCount} tool calls` : "Resolving…"}
              </span>
              <span className="font-mono">{script.provider}</span>
            </div>
          </div>

          <div className="rounded-xl border border-ink/12 bg-rail p-5 text-rail-soft">
            <div className="flex items-center justify-between border-b border-rail-line pb-3">
              <div className="eyebrow flex items-center gap-2 text-paper/70">
                <Terminal className="h-3.5 w-3.5" />
                Tool trace
              </div>
              <span className="tnum text-[11px] text-rail-soft">
                {stage > toolCount ? `${total}ms total` : `${Math.min(stage, toolCount)}/${toolCount}`}
              </span>
            </div>

            <ol className="mt-4 space-y-2.5">
              {script.tools.map((tool, position) => {
                const shown = stage > position;
                return (
                  <li
                    key={tool.name}
                    className={`rounded-md border border-rail-line bg-black/20 p-3 transition-all duration-500 ${
                      shown ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-mono text-[12px] text-warn">{tool.name}</span>
                      <span className="tnum text-[10.5px] text-rail-soft">{tool.ms}ms</span>
                    </div>
                    <div className="mt-1.5 font-mono text-[11px] break-all text-rail-soft/80">
                      {tool.args}
                    </div>
                    <div className="mt-1.5 flex items-center gap-1.5 text-[10.5px] text-ok">
                      <CornerDownLeft className="h-3 w-3" />
                      {tool.rows}
                    </div>
                  </li>
                );
              })}
            </ol>

            <div
              className={`mt-4 border-t border-rail-line pt-3 text-[11px] transition-opacity duration-500 ${
                stage > toolCount ? "opacity-100" : "opacity-0"
              }`}
            >
              <span className="text-paper/70">
                {script.id === "refuse"
                  ? "Primary chain failed over — the marker is visible in the real trace too."
                  : "Answer composed from the rows above, nothing else."}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}