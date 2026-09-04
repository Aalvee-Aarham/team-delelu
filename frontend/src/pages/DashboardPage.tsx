import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, DoorOpen, Megaphone, NotebookPen, PartyPopper, Activity } from "lucide-react";
import { useResourceList } from "@/hooks/useResource";
import { onCampusChange } from "@/hooks/useChangeStream";
import { useAuth } from "@/context/AuthContext";
import type { Announcement, Assignment, CampusEvent, ChangeEvent, Room, Schedule } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function nextClass(schedules: Schedule[], section: string) {
  const now = new Date();
  const nowDay = now.getDay();
  const nowTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const mine = schedules.filter((s) => s.section === section || s.section.includes(section));
  const pool = mine.length > 0 ? mine : schedules;

  for (let offset = 0; offset < 7; offset++) {
    const dayName = DAYS[(nowDay + offset) % 7];
    const onDay = pool
      .filter((s) => s.day === dayName)
      .filter((s) => offset > 0 || s.start_time > nowTime)
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
    if (onDay.length > 0) return { cls: onDay[0], inDays: offset };
  }
  return null;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [feed, setFeed] = useState<ChangeEvent[]>([]);

  const schedules = useResourceList<Schedule>("schedules");
  const rooms = useResourceList<Room>("rooms");
  const events = useResourceList<CampusEvent>("events");
  const announcements = useResourceList<Announcement>("announcements");
  const assignments = useResourceList<Assignment>("assignments");

  useEffect(() => onCampusChange((e) => setFeed((f) => [e, ...f].slice(0, 6))), []);

  const today = new Date().toISOString().slice(0, 10);
  const weekEnd = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

  const dueThisWeek = (assignments.data ?? []).filter(
    (a) => a.status === "pending" && a.deadline >= today && a.deadline <= weekEnd
  );
  const highPriority = (announcements.data ?? []).filter((a) => a.priority === "high" && a.expires >= today);
  const upcoming = (events.data ?? []).filter((e) => e.status === "upcoming" || e.status === "ongoing");
  const next = schedules.data ? nextClass(schedules.data, user?.section ?? "") : null;

  const loading = schedules.isLoading || rooms.isLoading || events.isLoading;

  const TILES = [
    { to: "/schedules", label: "Classes", value: schedules.data?.length, icon: CalendarDays },
    { to: "/rooms", label: "Rooms", value: rooms.data?.length, icon: DoorOpen },
    { to: "/events", label: "Events", value: events.data?.length, icon: PartyPopper },
    { to: "/announcements", label: "Notices", value: announcements.data?.length, icon: Megaphone },
    { to: "/assignments", label: "Assignments", value: assignments.data?.length, icon: NotebookPen },
  ];

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Good to see you, {user?.name.split(" ")[0]}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {TILES.map(({ to, label, value, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/50"
          >
            <Icon className="mb-2 h-4 w-4 text-muted-foreground" />
            <div className="text-2xl font-semibold tabular-nums">{value ?? "—"}</div>
            <div className="text-xs text-muted-foreground">{label}</div>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">Your next class</h2>
          {loading ? (
            <Skeleton className="h-20 w-full" />
          ) : next ? (
            <div>
              <div className="text-lg font-semibold">{next.cls.course}</div>
              <div className="text-sm text-muted-foreground">{next.cls.title}</div>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                <span>
                  {next.inDays === 0 ? "Today" : next.inDays === 1 ? "Tomorrow" : next.cls.day} · {next.cls.start_time}–
                  {next.cls.end_time}
                </span>
                <span className="text-muted-foreground">Room {next.cls.room}</span>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">{next.cls.instructor}</div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nothing scheduled.</p>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Activity className="h-4 w-4" /> Live changes
          </h2>
          {feed.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nothing yet. Edit a record in another tab and it appears here instantly.
            </p>
          ) : (
            <ul className="space-y-1.5 text-sm">
              {feed.map((e, i) => (
                <li key={i} className="flex items-center gap-2 text-muted-foreground">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      e.action === "delete" ? "bg-destructive" : e.action === "create" ? "bg-ok" : "bg-primary"
                    }`}
                  />
                  <span className="text-foreground">{e.collection}</span> {e.action}d
                  <span className="font-mono text-xs">{e.id}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">Due this week</h2>
          {dueThisWeek.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing due in the next seven days.</p>
          ) : (
            <ul className="space-y-2">
              {dueThisWeek.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="min-w-0">
                    <span className="font-medium">{a.course}</span>{" "}
                    <span className="text-muted-foreground">{a.title}</span>
                  </span>
                  <span className="shrink-0 text-xs tabular-nums text-warn">{a.deadline}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">High priority notices</h2>
          {highPriority.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing urgent.</p>
          ) : (
            <ul className="space-y-2">
              {highPriority.slice(0, 4).map((a) => (
                <li key={a.id} className="text-sm">
                  <div className="font-medium">{a.title}</div>
                  <div className="line-clamp-1 text-xs text-muted-foreground">{a.body}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {upcoming.length > 0 && (
        <div className="mt-4 rounded-xl border border-border bg-card p-5">
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">Coming up on campus</h2>
          <div className="flex flex-wrap gap-2">
            {upcoming.slice(0, 5).map((e) => (
              <Link
                key={e.id}
                to="/events"
                className="rounded-lg border border-border bg-background px-3 py-2 text-xs transition-colors hover:border-primary/50"
              >
                <div className="font-medium">{e.name}</div>
                <div className="text-muted-foreground">
                  {e.date} · {e.venue}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
