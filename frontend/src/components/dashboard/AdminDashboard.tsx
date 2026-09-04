import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  DoorOpen,
  GraduationCap,
  Megaphone,
  PartyPopper,
  Plus,
} from "lucide-react";
import { useResourceList } from "@/hooks/useResource";
import { useSubmissions } from "@/hooks/useClassroom";
import { onCampusChange } from "@/hooks/useChangeStream";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/axios";
import type { Announcement, CampusAnalytics, CampusEvent, ChangeEvent, Course, Room, Schedule } from "@/lib/types";
import { PRIORITY_TONE } from "@/lib/tone";
import { DAYS } from "@/lib/schedule.utils";
import { formatMoment } from "@/lib/classroom.utils";
import { PageHeader } from "@/components/PageHeader";
import { Panel } from "@/components/Panel";
import { StatTile } from "@/components/StatTile";
import { StatusPill } from "@/components/StatusPill";
import { StackedMeter, Meter } from "@/components/Meter";
import { AnalyticsChart } from "@/components/AnalyticsChart";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function AdminDashboard() {
  const { user } = useAuth();
  const [feed, setFeed] = useState<ChangeEvent[]>([]);
  const [analytics, setAnalytics] = useState<CampusAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  const schedules = useResourceList<Schedule>("schedules");
  const rooms = useResourceList<Room>("rooms");
  const events = useResourceList<CampusEvent>("events");
  const announcements = useResourceList<Announcement>("announcements");
  const courses = useResourceList<Course>("courses");
  const { data: submissions, isLoading: submissionsLoading } = useSubmissions();

  useEffect(() => onCampusChange((e) => setFeed((f) => [e, ...f].slice(0, 6))), []);

  const loadAnalytics = async () => {
    try {
      const { data } = await api.get<CampusAnalytics>("/analytics");
      setAnalytics(data);
    } catch {
      // analytics fallback handled gracefully
    } finally {
      setAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const today = new Date().toISOString().slice(0, 10);
  const todayName = DAYS[new Date().getDay()];

  const allRooms = rooms.data ?? [];
  const unavailable = allRooms.filter((r) => r.status === "unavailable").length;
  const booked = allRooms.filter((r) => r.status !== "unavailable" && r.bookings.length > 0).length;
  const free = Math.max(0, allRooms.length - unavailable - booked);

  const allSchedules = schedules.data ?? [];
  const classesToday = allSchedules.filter((s) => s.day === todayName);

  const allAnnouncements = announcements.data ?? [];
  const highPriority = allAnnouncements.filter((a) => a.priority === "high" && a.expires >= today);

  const allEvents = events.data ?? [];
  const upcomingEvents = allEvents.filter(
    (e) => e.status === "upcoming" || e.status === "ongoing"
  );

  const allCourses = courses.data ?? [];

  // Submissions needing review
  const pendingSubmissions = (submissions ?? []).filter((s) => s.status === "submitted");

  const TILES = [
    {
      to: "/submissions",
      label: "Awaiting review",
      value: pendingSubmissions.length,
      hint: `${pendingSubmissions.length} submissions pending grading`,
      icon: ClipboardCheck,
      tone: "amber" as const,
    },
    {
      to: "/courses",
      label: "Active courses",
      value: allCourses.length,
      hint: `${allCourses.reduce((acc, c) => acc + c.enrolled.length, 0)} total enrollments`,
      icon: GraduationCap,
      tone: "blue" as const,
    },
    {
      to: "/schedules",
      label: "Campus classes today",
      value: classesToday.length,
      hint: `${allSchedules.length} in weekly timetable`,
      icon: CalendarDays,
      tone: "cyan" as const,
    },
    {
      to: "/rooms",
      label: "Free rooms now",
      value: free,
      hint: `${allRooms.length} total rooms`,
      icon: DoorOpen,
      tone: "green" as const,
    },
    {
      to: "/announcements",
      label: "Urgent broadcasts",
      value: highPriority.length,
      hint: `${allAnnouncements.length} active announcements`,
      icon: Megaphone,
      tone: "ink" as const,
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow={`${new Date().toLocaleDateString(undefined, {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })} · Campus Administrator`}
        title={`Campus Operations — Welcome, ${user?.name ?? "Admin"}`}
        subtitle="Campus-wide overview, submission grading queue, real-time audit stream, and facility utilisation."
        action={
          <div className="flex items-center gap-2">
            <Link to="/submissions" className={buttonVariants({ size: "sm" })}>
              <ClipboardCheck className="h-4 w-4" />
              Review submissions ({pendingSubmissions.length})
            </Link>
            <Link to="/courses" className={buttonVariants({ variant: "outline", size: "sm" })}>
              <Plus className="h-4 w-4" />
              Manage courses
            </Link>
          </div>
        }
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {TILES.map((tile) => (
          <StatTile key={tile.to} {...tile} />
        ))}
      </div>

      <div className="mb-6 grid gap-5 lg:grid-cols-[1.35fr_1fr]">
        <Panel
          eyebrow="Review Queue"
          title="Submissions awaiting review"
          icon={ClipboardCheck}
          tone="amber"
          action={
            <Link to="/submissions" className="text-[13px] font-medium text-primary hover:underline">
              Open submissions
            </Link>
          }
        >
          {submissionsLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : pendingSubmissions.length === 0 ? (
            <div className="py-6 text-center">
              <CheckCircle2 className="mx-auto mb-2 h-7 w-7 text-ok" />
              <p className="text-[13px] font-medium text-foreground">All caught up!</p>
              <p className="mt-0.5 text-[12px] text-muted-foreground">
                There are no pending submissions awaiting review right now.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-[12px] text-muted-foreground">
                {pendingSubmissions.length} student submission
                {pendingSubmissions.length === 1 ? "" : "s"} ready for review and grading:
              </p>
              <ul className="divide-y divide-ink/10">
                {pendingSubmissions.slice(0, 5).map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge>{s.course_code}</Badge>
                        <span className="truncate text-[13px] font-semibold text-foreground">
                          {s.student_name}
                        </span>
                        <span className="font-mono text-[11px] text-muted-foreground">
                          ({s.student_id})
                        </span>
                      </div>
                      <div className="mt-0.5 truncate text-[12px] text-muted-foreground">
                        {s.assignment_title} · {formatMoment(s.submitted_at)}
                      </div>
                    </div>
                    <Link
                      to="/submissions"
                      className={buttonVariants({ size: "sm", variant: "outline", className: "shrink-0 text-xs" })}
                    >
                      Grade
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Panel>

        <Panel eyebrow="Realtime" title="Live changes audit" icon={Activity} tone="green">
          {feed.length === 0 ? (
            <p className="text-[13px] leading-relaxed text-muted-foreground">
              Listening for campus database mutations. Changes from any tab or user session appear
              here instantly.
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

      <div className="mb-6">
        <Panel
          eyebrow="Campus Analytics"
          title="Real-time campus utilization & activity"
          icon={BarChart3}
          tone="blue"
        >
          {analyticsLoading ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
            </div>
          ) : analytics ? (
            <AnalyticsChart data={analytics} />
          ) : (
            <p className="text-[13px] text-muted-foreground">Unable to load campus analytics.</p>
          )}
        </Panel>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Panel eyebrow="Estate" title="Room utilisation" icon={DoorOpen} tone="blue">
          {rooms.isLoading ? (
            <Skeleton className="h-20 w-full" />
          ) : (
            <div className="space-y-4">
              <StackedMeter
                total={allRooms.length}
                segments={[
                  { label: "booked", value: booked, tone: "blue" },
                  { label: "unavailable", value: unavailable, tone: "red" },
                  { label: "free", value: free, tone: "green" },
                ]}
              />
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>{booked} in use</span>
                <span>{free} available</span>
                <span>{unavailable} unavailable</span>
              </div>
            </div>
          )}
        </Panel>

        <Panel
          eyebrow="Broadcasts"
          title="High priority notices"
          icon={Megaphone}
          tone="red"
          action={
            <Link
              to="/announcements"
              className="text-[13px] font-medium text-primary hover:underline"
            >
              All notices
            </Link>
          }
        >
          {highPriority.length === 0 ? (
            <p className="text-[13px] text-muted-foreground">No urgent notices active.</p>
          ) : (
            <ul className="divide-y divide-ink/10">
              {highPriority.slice(0, 3).map((a) => (
                <li key={a.id} className="py-2 first:pt-0">
                  <div className="flex items-center gap-2">
                    <StatusPill tone={PRIORITY_TONE[a.priority]}>{a.priority}</StatusPill>
                    <span className="truncate text-[13px] font-medium">{a.title}</span>
                  </div>
                  <p className="mt-0.5 line-clamp-1 text-[12px] text-muted-foreground">{a.body}</p>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          eyebrow="On Campus"
          title="Events capacity"
          icon={PartyPopper}
          tone="violet"
          action={
            <Link to="/events" className="text-[13px] font-medium text-primary hover:underline">
              All events
            </Link>
          }
        >
          {upcomingEvents.length === 0 ? (
            <p className="text-[13px] text-muted-foreground">No upcoming events scheduled.</p>
          ) : (
            <ul className="space-y-3">
              {upcomingEvents.slice(0, 3).map((e) => (
                <li key={e.id}>
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="truncate font-semibold">{e.name}</span>
                    <span className="tnum shrink-0 text-[11px] text-muted-foreground">
                      {e.registered}/{e.capacity}
                    </span>
                  </div>
                  <div className="mt-1.5">
                    <Meter
                      value={e.registered}
                      max={e.capacity}
                      size="sm"
                      tone={e.registered >= e.capacity ? "amber" : "violet"}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
