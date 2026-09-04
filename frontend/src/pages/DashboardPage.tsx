import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  CalendarDays,
  DoorOpen,
  Megaphone,
  NotebookPen,
  PartyPopper,
} from "lucide-react";
import { useResourceList } from "@/hooks/useResource";
import { onCampusChange } from "@/hooks/useChangeStream";
import { useAuth } from "@/context/AuthContext";
import type { Announcement, Assignment, CampusEvent, ChangeEvent, Room, Schedule } from "@/lib/types";
import { PRIORITY_TONE } from "@/lib/tone";
import { DAYS, nextClass } from "@/lib/schedule.utils";
import { PageHeader } from "@/components/PageHeader";
import { Panel } from "@/components/Panel";
import { StatTile } from "@/components/StatTile";
import { StatusPill } from "@/components/StatusPill";
import { NextClassPanel } from "@/components/NextClassPanel";
import { StackedMeter, Meter } from "@/components/Meter";
import { Skeleton } from "@/components/ui/skeleton";

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
  const todayName = DAYS[new Date().getDay()];

  const allRooms = rooms.data ?? [];
  const unavailable = allRooms.filter((r) => r.status === "unavailable").length;
  const booked = allRooms.filter((r) => r.status !== "unavailable" && r.bookings.length > 0).length;
  const free = Math.max(0, allRooms.length - unavailable - booked);

  const classesToday = (schedules.data ?? []).filter((s) => s.day === todayName);
  const dueThisWeek = (assignments.data ?? []).filter(
    (a) => a.status === "pending" && a.deadline >= today && a.deadline <= weekEnd
  );
  const highPriority = (announcements.data ?? []).filter(
    (a) => a.priority === "high" && a.expires >= today
  );
  const upcoming = (events.data ?? []).filter(
    (e) => e.status === "upcoming" || e.status === "ongoing"
  );
  const next = schedules.data ? nextClass(schedules.data, user?.section ?? "") : null;

  const TILES = [
    {
      to: "/schedules",
      label: "Classes today",
      value: classesToday.length,
      hint: `${schedules.data?.length ?? 0} in the weekly timetable`,
      icon: CalendarDays,
      tone: "amber" as const,
    },
    {
      to: "/assignments",
      label: "Due this week",
      value: dueThisWeek.length,
      hint: `${assignments.data?.length ?? 0} assignments tracked`,
      icon: NotebookPen,
      tone: "red" as const,
    },
    {
      to: "/rooms",
      label: "Rooms free",
      value: free,
      hint: `${allRooms.length} rooms on campus`,
      icon: DoorOpen,
      tone: "blue" as const,
    },
    {
      to: "/events",
      label: "Events ahead",
      value: upcoming.length,
      hint: `${events.data?.length ?? 0} in total`,
      icon: PartyPopper,
      tone: "violet" as const,
    },
    {
      to: "/announcements",
      label: "Urgent notices",
      value: highPriority.length,
      hint: `${announcements.data?.length ?? 0} active notices`,
      icon: Megaphone,
      tone: "ink" as const,
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow={new Date().toLocaleDateString(undefined, {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
        title={`Good to see you, ${user?.name.split(" ")[0] ?? "there"}`}
        subtitle="Everything below is read straight from the live database and updates itself as records change."
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {TILES.map((tile) => (
          <StatTile key={tile.to} {...tile} />
        ))}
      </div>

      <div className="mb-6 grid gap-5 lg:grid-cols-[1.35fr_1fr]">
        <NextClassPanel next={next} loading={schedules.isLoading} />

        <Panel eyebrow="Realtime" title="Live changes" icon={Activity} tone="green">
          {feed.length === 0 ? (
            <p className="text-[13px] leading-relaxed text-muted-foreground">
              Nothing yet. Edit a record in another tab and it appears here instantly, without a
              refresh.
            </p>
          ) : (
            <ul className="space-y-2.5">
              {feed.map((e, i) => (
                <li key={`${e.id}-${i}`} className="flex items-center gap-2.5 text-[13px]">
                  <span
                    className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                      e.action === "delete"
                        ? "bg-destructive"
                        : e.action === "create"
                          ? "bg-ok"
                          : "bg-primary"
                    }`}
                  />
                  <span className="font-medium capitalize">{e.collection}</span>
                  <span className="text-muted-foreground">{e.action}d</span>
                  <span className="ml-auto truncate font-mono text-[11px] text-muted-foreground">
                    {e.id}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="mb-6 grid gap-5 lg:grid-cols-2">
        <Panel
          eyebrow="Next seven days"
          title="Due this week"
          icon={NotebookPen}
          tone="red"
          action={
            <Link to="/assignments" className="text-[13px] font-medium text-primary hover:underline">
              View all
            </Link>
          }
        >
          {dueThisWeek.length === 0 ? (
            <p className="text-[13px] text-muted-foreground">Nothing due in the next seven days.</p>
          ) : (
            <ul className="divide-y divide-ink/10">
              {dueThisWeek.slice(0, 5).map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0">
                  <span className="min-w-0">
                    <span className="text-[13px] font-semibold">{a.course}</span>
                    <span className="ml-2 text-[13px] text-muted-foreground">{a.title}</span>
                  </span>
                  <span className="tnum shrink-0 text-[11px] font-semibold text-[#8a6608]">
                    {a.deadline}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          eyebrow="Needs attention"
          title="High priority notices"
          icon={Megaphone}
          tone="red"
          action={
            <Link
              to="/announcements"
              className="text-[13px] font-medium text-primary hover:underline"
            >
              View all
            </Link>
          }
        >
          {highPriority.length === 0 ? (
            <p className="text-[13px] text-muted-foreground">Nothing urgent right now.</p>
          ) : (
            <ul className="divide-y divide-ink/10">
              {highPriority.slice(0, 4).map((a) => (
                <li key={a.id} className="py-2.5 first:pt-0">
                  <div className="flex items-center gap-2">
                    <StatusPill tone={PRIORITY_TONE[a.priority]}>{a.priority}</StatusPill>
                    <span className="truncate text-[13px] font-medium">{a.title}</span>
                  </div>
                  <p className="mt-1 line-clamp-1 text-[12px] text-muted-foreground">{a.body}</p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_1.35fr]">
        <Panel eyebrow="Estate" title="Room utilisation" icon={DoorOpen} tone="blue">
          {rooms.isLoading ? (
            <Skeleton className="h-20 w-full" />
          ) : (
            <StackedMeter
              total={allRooms.length}
              segments={[
                { label: "booked", value: booked, tone: "blue" },
                { label: "unavailable", value: unavailable, tone: "red" },
                { label: "free", value: free, tone: "green" },
              ]}
            />
          )}
        </Panel>

        <Panel
          eyebrow="On campus"
          title="Coming up"
          icon={PartyPopper}
          tone="violet"
          action={
            <Link to="/events" className="text-[13px] font-medium text-primary hover:underline">
              View all
            </Link>
          }
        >
          {upcoming.length === 0 ? (
            <p className="text-[13px] text-muted-foreground">No events scheduled.</p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {upcoming.slice(0, 4).map((e) => (
                <li key={e.id}>
                  <Link
                    to="/events"
                    className="block rounded-md border border-ink/12 p-3 transition-colors hover:border-ink/35 hover:bg-paper-deep/40"
                  >
                    <div className="truncate text-[13px] font-semibold">{e.name}</div>
                    <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <CalendarDays className="h-3 w-3" />
                      {e.date}
                      <span className="text-ink/25">·</span>
                      {e.venue}
                    </div>
                    <div className="mt-3">
                      <Meter
                        value={e.registered}
                        max={e.capacity}
                        size="sm"
                        tone={e.registered >= e.capacity ? "amber" : "violet"}
                      />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
