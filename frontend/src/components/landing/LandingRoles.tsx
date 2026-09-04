import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, GraduationCap, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROLES } from "@/components/landing/landing.data";
import { SectionHeading } from "@/components/landing/SectionHeading";

const ICONS = { student: GraduationCap, admin: ShieldCheck };

export function LandingRoles() {
  const [active, setActive] = useState(0);
  const role = ROLES[active];

  return (
    <section id="roles" className="relative scroll-mt-24 px-5 py-24 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Roles"
          title="The same agent, two sets of permissions."
          copy="Authorisation is enforced where the tools run. Sign in as each demo account and ask for the same thing — one gets it done, the other gets told why not."
          align="center"
        />

        <div data-reveal className="mt-10 flex justify-center">
          <div className="relative flex rounded-full border border-ink/15 bg-card p-1">
            <span
              aria-hidden
              className="absolute inset-y-1 w-[calc(50%-0.25rem)] rounded-full bg-ink transition-transform duration-[400ms] ease-out"
              style={{ transform: `translateX(${active * 100}%)` }}
            />
            {ROLES.map((item, index) => {
              const Icon = ICONS[item.id];
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActive(index)}
                  className={`relative z-10 flex w-40 items-center justify-center gap-2 rounded-full px-5 py-2 text-[13px] font-semibold transition-colors duration-300 ${
                    index === active ? "text-paper" : "text-ink/60 hover:text-ink"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        <div
          key={role.id}
          className="animate-fade-up mx-auto mt-8 grid max-w-4xl gap-4 md:grid-cols-2"
        >
          <div className="rounded-xl border border-ink/12 bg-card p-6">
            <p className="text-[14px] leading-relaxed text-ink/75">{role.blurb}</p>
            <ul className="mt-5 space-y-2.5">
              {role.can.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-[13px] leading-relaxed">
                  <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-ok/15 text-[#15803d]">
                    <Check className="h-2.5 w-2.5" strokeWidth={3} />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <ul className="mt-4 space-y-2.5 border-t border-dashed border-ink/12 pt-4">
              {role.cannot.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2.5 text-[13px] leading-relaxed text-muted-foreground"
                >
                  <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-destructive/12 text-[#b91c1c]">
                    <X className="h-2.5 w-2.5" strokeWidth={3} />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col justify-between rounded-xl border border-ink/12 bg-rail p-6 text-paper">
            <div>
              <div className="eyebrow text-paper/55">Demo account</div>
              <div className="mt-4 space-y-3">
                <div>
                  <div className="eyebrow text-paper/45">Email</div>
                  <div className="mt-1.5 font-mono text-[13.5px] break-all text-warn">
                    {role.email}
                  </div>
                </div>
                <div>
                  <div className="eyebrow text-paper/45">Password</div>
                  <div className="mt-1.5 font-mono text-[13.5px] text-warn">{role.password}</div>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <Button variant="default" className="nudge w-full" render={<Link to="/login" />}>
                Sign in as {role.label.toLowerCase()}
                <ArrowRight />
              </Button>
              <p className="mt-3 text-[11.5px] leading-relaxed text-rail-soft">
                The credentials are pre-seeded on first start — paste them in, or use the demo
                buttons on the sign-in form.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}