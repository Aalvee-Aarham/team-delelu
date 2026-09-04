import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Menu, Radio } from "lucide-react";
import { findNavGroup, findNavItem } from "@/lib/nav";
import { onCampusChange } from "@/hooks/useChangeStream";

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const { pathname } = useLocation();
  const item = findNavItem(pathname);
  const group = findNavGroup(pathname);
  const [changes, setChanges] = useState(0);

  useEffect(() => onCampusChange(() => setChanges((count) => count + 1)), []);

  return (
    <header className="sticky top-0 z-30 border-b border-ink/12 bg-paper/85 backdrop-blur-sm">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-4 px-5 sm:px-8">
        <button
          type="button"
          onClick={onMenu}
          aria-label="Open navigation"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-ink/15 bg-card text-foreground transition-colors hover:border-ink/40 md:hidden"
        >
          <Menu className="h-4 w-4" />
        </button>

        <div className="min-w-0 flex-1">
          <div className="eyebrow text-muted-foreground">{group?.label ?? "CampusOS"}</div>
          <h1 className="mt-1 truncate text-[15px] leading-none font-semibold tracking-tight">
            {item?.label ?? "CampusOS"}
          </h1>
        </div>

        <div className="hidden items-center gap-2 text-[11px] text-muted-foreground sm:flex">
          <span className="tnum">
            {new Date().toLocaleDateString(undefined, {
              weekday: "short",
              day: "numeric",
              month: "short",
            })}
          </span>
          <span className="h-3.5 w-px bg-ink/15" />
          <span className="inline-flex items-center gap-1.5 rounded border border-ok/35 bg-ok/12 px-2 py-1 font-semibold text-[#15803d]">
            <Radio className="h-3 w-3" />
            <span className="eyebrow">Live</span>
            {changes > 0 && <span className="tnum">{changes}</span>}
            <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-ok" />
          </span>
        </div>
      </div>
    </header>
  );
}
