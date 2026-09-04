import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Menu, X } from "lucide-react";
import { Brand } from "@/components/Brand";
import { Button } from "@/components/ui/button";
import { scrollToSection } from "@/lib/scroll";

const SECTIONS = [
  { id: "features", label: "What it manages" },
  { id: "agent", label: "The agent" },
  { id: "live", label: "Live truth" },
  { id: "how", label: "How it works" },
  { id: "roles", label: "Roles" },
];

function useActiveSection() {
  const [active, setActive] = useState("");

  useEffect(() => {
    const nodes = SECTIONS.map(({ id }) => document.getElementById(id)).filter(
      (node): node is HTMLElement => Boolean(node)
    );
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: [0, 0.25, 0.6] }
    );
    for (const node of nodes) observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return active;
}

export function LandingNav({ lifted }: { lifted: boolean }) {
  const active = useActiveSection();
  const [open, setOpen] = useState(false);

  const go = (id: string) => {
    setOpen(false);
    scrollToSection(id);
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        lifted
          ? "border-b border-ink/12 bg-paper/85 backdrop-blur-md"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div
        className="absolute inset-x-0 bottom-0 h-px origin-left bg-primary"
        style={{ transform: "scaleX(var(--progress, 0))" }}
        aria-hidden
      />

      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-5 py-4 lg:px-8">
        <button
          type="button"
          onClick={() => document.getElementById("top")?.scrollIntoView({ behavior: "smooth" })}
          className="transition-transform duration-300 hover:-translate-y-px"
        >
          <Brand />
        </button>

        <nav className="hidden items-center gap-7 lg:flex">
          {SECTIONS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => go(id)}
              data-active={active === id}
              className="underline-sweep text-[13px] font-medium text-muted-foreground transition-colors duration-200 hover:text-ink data-[active=true]:text-ink"
            >
              {label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="hidden sm:inline-flex" render={<Link to="/login" />}>
            Sign in
          </Button>
          <Button size="sm" className="nudge" render={<Link to="/register" />}>
            Get started
            <ArrowRight />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            className="lg:hidden"
            aria-label="Toggle menu"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X /> : <Menu />}
          </Button>
        </div>
      </div>

      <div
        className={`overflow-hidden border-ink/10 bg-paper/95 backdrop-blur-md transition-all duration-300 lg:hidden ${
          open ? "max-h-80 border-b" : "max-h-0"
        }`}
      >
        <nav className="mx-auto flex max-w-6xl flex-col px-5 py-2">
          {SECTIONS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => go(id)}
              className="border-b border-ink/8 py-3 text-left text-[14px] font-medium text-ink/80 transition-colors hover:text-ink"
            >
              {label}
            </button>
          ))}
          <Link to="/login" className="py-3 text-[14px] font-medium text-primary">
            Sign in
          </Link>
        </nav>
      </div>
    </header>
  );
}