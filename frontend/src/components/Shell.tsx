import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import {
  CalendarDays,
  DoorOpen,
  Megaphone,
  NotebookPen,
  PartyPopper,
  LayoutDashboard,
  MessageSquare,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useChangeStream } from "@/hooks/useChangeStream";
import { Button } from "@/components/ui/button";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/schedules", label: "Schedules", icon: CalendarDays },
  { to: "/rooms", label: "Rooms", icon: DoorOpen },
  { to: "/events", label: "Events", icon: PartyPopper },
  { to: "/announcements", label: "Announcements", icon: Megaphone },
  { to: "/assignments", label: "Assignments", icon: NotebookPen },
  { to: "/chat", label: "AI Agent", icon: MessageSquare },
];

export function Shell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  useChangeStream();

  return (
    <div className="flex h-full">
      <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-card">
        <div className="flex items-center gap-2 px-5 py-5">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            C
          </div>
          <div>
            <div className="text-sm font-semibold leading-tight">CampusOS</div>
            <div className="text-[11px] text-muted-foreground">AUST</div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? "bg-primary/15 font-medium text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-border p-3">
          <div className="mb-2 px-2">
            <div className="truncate text-sm font-medium">{user?.name}</div>
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <span>{user?.student_id}</span>
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] font-medium uppercase ${
                  user?.role === "admin" ? "bg-violet/20 text-violet" : "bg-ok/15 text-ok"
                }`}
              >
                {user?.role}
              </span>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground" onClick={logout}>
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-8 py-8">{children}</div>
      </main>
    </div>
  );
}
