import { useState } from "react";
import type { ReactNode } from "react";
import { useChangeStream } from "@/hooks/useChangeStream";
import { PaperBackdrop } from "@/components/Decor";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";

export function Shell({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  useChangeStream();

  return (
    <div className="flex h-full">
      <PaperBackdrop />

      {menuOpen && (
        <div
          role="presentation"
          onClick={() => setMenuOpen(false)}
          className="fixed inset-0 z-40 bg-ink/40 md:hidden"
        />
      )}

      <Sidebar open={menuOpen} onNavigate={() => setMenuOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenu={() => setMenuOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-6xl px-5 py-7 sm:px-8 sm:py-9">{children}</div>
        </main>
      </div>
    </div>
  );
}
