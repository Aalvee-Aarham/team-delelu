import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CalendarDays, DoorOpen, Sparkles } from "lucide-react";
import { Brand, BrandMark } from "@/components/Brand";
import { TickMark } from "@/components/Decor";

const HIGHLIGHTS = [
  { icon: CalendarDays, label: "Timetable, deadlines and notices in one place" },
  { icon: DoorOpen, label: "Room availability checked against real bookings" },
  { icon: Sparkles, label: "An agent that reads and acts on live campus data" },
];

export function AuthLayout({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="grid h-full lg:grid-cols-[1.1fr_1fr]">
      <section className="relative hidden overflow-hidden border-r border-ink/20 lg:flex lg:flex-col lg:justify-between">
        <img
          src="/background.png"
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-paper/85 via-paper/35 to-transparent" />

        <div className="relative p-10">
          <Link to="/" className="inline-block transition-transform duration-300 hover:-translate-y-px">
            <Brand size="lg" tagline />
          </Link>
        </div>

        <div className="relative p-10">
          <TickMark className="mb-7 h-3 w-20 text-ink/40" />
          <h2 className="max-w-md text-[34px] leading-[1.1] font-bold tracking-tight text-ink">
            One source of truth for the whole campus.
          </h2>
          <ul className="mt-8 max-w-md space-y-3.5">
            {HIGHLIGHTS.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-start gap-3">
                <span className="mt-px grid h-6 w-6 shrink-0 place-items-center rounded border border-ink/25 bg-card">
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <span className="text-[13px] leading-relaxed text-ink/75">{label}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="grain relative flex items-center justify-center overflow-y-auto bg-paper px-5 py-12">
        <div className="relative w-full max-w-sm">
          <Link to="/" className="mb-8 flex items-center gap-3 lg:hidden">
            <BrandMark className="h-9 w-9" />
            <span className="text-[17px] font-extrabold tracking-tight">CampusOS</span>
          </Link>

          <Link
            to="/"
            className="mb-6 hidden items-center gap-1.5 text-[12px] text-muted-foreground transition-colors hover:text-ink lg:inline-flex"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to overview
          </Link>

          <div className="eyebrow mb-3 text-muted-foreground">{eyebrow}</div>
          <h1 className="text-[26px] leading-tight font-bold tracking-tight">{title}</h1>
          <p className="mt-2.5 text-[13px] leading-relaxed text-muted-foreground">{subtitle}</p>

          <div className="mt-7 rounded-lg border border-ink/12 bg-card p-6">{children}</div>

          <div className="mt-5 text-center text-[13px] text-muted-foreground">{footer}</div>
        </div>
      </section>
    </div>
  );
}
