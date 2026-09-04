import { Link } from "react-router-dom";
import { ArrowRight, CodeXml, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Brand } from "@/components/Brand";
import { HalftoneSquare, TickMark } from "@/components/Decor";

const COMMANDS = ["npm install", "cp backend/.env.example backend/.env", "npm run dev"];

export function LandingCta() {
  return (
    <>
      <section className="relative overflow-hidden border-t border-ink/12 bg-rail px-5 py-24 text-paper lg:px-8">
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden opacity-40">
          <div data-parallax="0.2" className="absolute -top-6 left-[12%] h-32 w-1.5 bg-warn/70" />
          <div data-parallax="-0.24" className="absolute right-[14%] bottom-0 h-1.5 w-32 bg-primary/80" />
          <div data-parallax="0.3" className="absolute top-1/2 right-[6%] h-40 w-40 rounded-full bg-violet/25 blur-3xl" />
        </div>

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div data-reveal className="flex items-center gap-3">
              <TickMark className="h-3 w-12 text-paper/40" />
              <span className="eyebrow text-paper/55">Get started</span>
            </div>
            <h2
              data-reveal
              style={{ "--reveal-delay": "80ms" } as React.CSSProperties}
              className="mt-5 text-[34px] leading-[1.06] font-extrabold tracking-tight sm:text-[46px]"
            >
              Ask your campus a question.
              <br />
              <span className="sheen-text">Get an answer with receipts.</span>
            </h2>
            <p
              data-reveal
              style={{ "--reveal-delay": "150ms" } as React.CSSProperties}
              className="mt-5 max-w-lg text-[15px] leading-relaxed text-rail-soft"
            >
              Two demo accounts are seeded on first start. Sign in as a student, then as an admin,
              and ask the same thing both times.
            </p>

            <div
              data-reveal
              style={{ "--reveal-delay": "220ms" } as React.CSSProperties}
              className="mt-9 flex flex-wrap gap-3"
            >
              <Button size="lg" className="nudge" render={<Link to="/register" />}>
                Create an account
                <ArrowRight />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-paper/25 bg-transparent text-paper hover:border-paper/60 hover:bg-white/5"
                render={<Link to="/login" />}
              >
                Use a demo account
              </Button>
            </div>
          </div>

          <div
            data-reveal="scale"
            style={{ "--reveal-delay": "180ms" } as React.CSSProperties}
            className="rounded-xl border border-rail-line bg-black/25 p-5"
          >
            <div className="eyebrow flex items-center gap-2 border-b border-rail-line pb-3 text-paper/55">
              <Terminal className="h-3.5 w-3.5" />
              Run it locally
            </div>
            <div className="mt-4 space-y-2.5 font-mono text-[12.5px]">
              {COMMANDS.map((command) => (
                <div key={command} className="flex items-start gap-2.5">
                  <span className="text-ok">$</span>
                  <span className="break-all text-rail-soft">{command}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 border-t border-rail-line pt-4 text-[11.5px] leading-relaxed text-rail-soft">
              Backend on <span className="font-mono text-warn">:4000</span>, frontend on{" "}
              <span className="font-mono text-warn">:5173</span>. The database seeds itself from{" "}
              <span className="font-mono">data/*.json</span> on first start.
            </div>
          </div>
        </div>

        <div aria-hidden className="pointer-events-none absolute -bottom-8 left-8 opacity-15">
          <HalftoneSquare className="h-28 w-28 invert" />
        </div>
      </section>

      <footer className="grain relative bg-paper px-5 py-10 lg:px-8">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <Brand tagline />
          <div className="flex items-center gap-6 text-[12.5px] text-muted-foreground">
            <span>Built for the hackathon by team delelu</span>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 transition-colors hover:text-ink"
            >
              <CodeXml className="h-3.5 w-3.5" />
              Source
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}