import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  GraduationCap,
  Megaphone,
  NotebookPen,
  PartyPopper,
  Sparkles,
} from "lucide-react";
import { useResourceList } from "@/hooks/useResource";
import { useSubmissions } from "@/hooks/useClassroom";
import { useAuth } from "@/context/AuthContext";
import type { Announcement, Assignment, CampusEvent, Course, Schedule } from "@/lib/types";
import { PRIORITY_TONE } from "@/lib/tone";
import { DAYS, nextClass } from "@/lib/schedule.utils";
import { SUBMISSION_LABEL, SUBMISSION_TONE, daysUntil, formatMoment } from "@/lib/classroom.utils";
import { PageHeader } from "@/components/PageHeader";
import { Panel } from "@/components/Panel";
import { StatTile } from "@/components/StatTile";
import { StatusPill } from "@/components/StatusPill";
import { NextClassPanel } from "@/components/NextClassPanel";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { isCourseInStudentSemester } from "@/lib/course.utils";

export function StudentDashboard() {
  const { user } = useAuth();

  const schedules = useResourceList<Schedule>("schedules");
  const courses = useResourceList<Course>("courses");
  const assignments = useResourceList<Assignment>("assignments");
  const events = useResourceList<CampusEvent>("events");
  const announcements = useResourceList<Announcement>("announcements");
  const { data: submissions } = useSubmissions();

  const today = new Date().toISOString().slice(0, 10);
  const weekEnd = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  const todayName = DAYS[new Date().getDay()];

  const studentId = user?.student_id ?? "";
  const userYear = user?.year ?? 4;
  const userSem = user?.semester ?? 1;
  const userDept = user?.department ?? "CSE";

  // 1. Department & semester courses for this student
  const allCourses = courses.data ?? [];
  const semesterCourses = useMemo(
    () => allCourses.filter((c) => isCourseInStudentSemester(c.code, user)),
    [allCourses, user]
  );

  // 2. Student's enrolled courses (or default to current semester courses if none explicitly joined)
  const myCourses = useMemo(
    () => allCourses.filter((c) => c.enrolled.includes(studentId)),
    [allCourses, studentId]
  );
  const hasEnrolled = myCourses.length > 0;

  // Active courses: enrolled courses if any, otherwise curriculum courses for student's year/semester/dept
  const activeStudentCourses = hasEnrolled ? myCourses : semesterCourses;
  const activeCourseCodes = useMemo(() => new Set(activeStudentCourses.map((c) => c.code)), [activeStudentCourses]);
  const activeCourseIds = useMemo(() => new Set(activeStudentCourses.map((c) => c.id)), [activeStudentCourses]);

  // 3. Student's schedule: classes for their semester courses and section
  const allSchedules = schedules.data ?? [];
  const mySchedules = useMemo(() => {
    return allSchedules.filter(
      (s) =>
        activeCourseCodes.has(s.course) &&
        (!s.section || !user?.section || s.section === user.section || s.section.includes(user.section))
    );
  }, [allSchedules, activeCourseCodes, user?.section]);

  const classesToday = useMemo(
    () =>
      mySchedules
        .filter((s) => s.day === todayName)
        .sort((a, b) => a.start_time.localeCompare(b.start_time)),
    [mySchedules, todayName]
  );

  const next = useMemo(
    () => nextClass(mySchedules, user?.section ?? ""),
    [mySchedules, user?.section]
  );

  // 3. Student's submissions and assignments
  const mySubmissions = useMemo(
    () => (submissions ?? []).filter((s) => s.student_id === studentId),
    [submissions, studentId]
  );

  const mySubmissionsMap = useMemo(() => {
    const map = new Map<string, (typeof mySubmissions)[0]>();
    for (const s of mySubmissions) map.set(s.assignment_id, s);
    return map;
  }, [mySubmissions]);

  const allAssignments = assignments.data ?? [];
  const relevantAssignments = useMemo(() => {
    return allAssignments.filter(
      (a) => activeCourseIds.has(a.course_id) || activeCourseCodes.has(a.course)
    );
  }, [allAssignments, activeCourseIds, activeCourseCodes]);

  const dueThisWeek = useMemo(
    () =>
      relevantAssignments
        .filter((a) => {
          const sub = mySubmissionsMap.get(a.id);
          const isSubmitted = sub && (sub.status === "submitted" || sub.status === "accepted");
          return !isSubmitted && a.deadline >= today && a.deadline <= weekEnd;
        })
        .sort((a, b) => a.deadline.localeCompare(b.deadline)),
    [relevantAssignments, mySubmissionsMap, today, weekEnd]
  );

  // 4. Student's registered events
  const allEvents = events.data ?? [];
  const myRegisteredEvents = useMemo(
    () => allEvents.filter((e) => e.registrations?.some((r) => r.student_id === studentId)),
    [allEvents, studentId]
  );

  // 5. Announcements relevant to student (campus-wide + enrolled courses)
  const allAnnouncements = announcements.data ?? [];
  const relevantAnnouncements = useMemo(
    () =>
      allAnnouncements
        .filter(
          (a) =>
            !a.course_id ||
            activeCourseIds.has(a.course_id) ||
            activeCourseCodes.has(a.course_id) ||
            !hasEnrolled
        )
        .filter((a) => a.priority === "high" && a.expires >= today),
    [allAnnouncements, activeCourseIds, activeCourseCodes, hasEnrolled, today]
  );

  const TILES = [
    {
      to: "/schedules",
      label: "My classes today",
      value: classesToday.length,
      hint: `Year ${userYear} Sem ${userSem} schedule`,
      icon: CalendarDays,
      tone: "amber" as const,
    },
    {
      to: "/assignments",
      label: "Due this week",
      value: dueThisWeek.length,
      hint: `${relevantAssignments.length} assignments in this semester`,
      icon: NotebookPen,
      tone: "red" as const,
    },
    {
      to: "/courses",
      label: "Semester courses",
      value: myCourses.length > 0 ? myCourses.length : semesterCourses.length,
      hint: hasEnrolled ? `${myCourses.length} enrolled of ${semesterCourses.length}` : `${semesterCourses.length} in curriculum`,
      icon: GraduationCap,
      tone: "blue" as const,
    },
    {
      to: "/submissions",
      label: "My submissions",
      value: mySubmissions.length,
      hint: `${mySubmissions.filter((s) => s.status === "accepted").length} accepted / graded`,
      icon: ClipboardCheck,
      tone: "green" as const,
    },
    {
      to: "/events",
      label: "Registered events",
      value: myRegisteredEvents.length,
      hint: `of ${allEvents.length} total campus events`,
      icon: PartyPopper,
      tone: "violet" as const,
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
        })} · ${userDept} · Year ${userYear}, Semester ${userSem} · Section ${user?.section ?? "B"} · Student ID: ${studentId}`}
        title={`Good to see you, ${user?.name.split(" ")[0] ?? "there"}`}
        subtitle={`Personalized dashboard for ${userDept} Year ${userYear}, Semester ${userSem}. Showing your semester classes, coursework, and events.`}
        action={
          <div className="flex items-center gap-2">
            <Link to="/courses" className={buttonVariants({ variant: "outline", size: "sm" })}>
              <GraduationCap className="h-4 w-4" />
              Manage courses
            </Link>
            <Link to="/chat" className={buttonVariants({ size: "sm" })}>
              <Sparkles className="h-4 w-4" />
              Ask Assistant
            </Link>
          </div>
        }
      />

      {!hasEnrolled && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4 text-[13px]">
          <div className="flex items-center gap-3">
            <GraduationCap className="h-5 w-5 text-primary shrink-0" />
            <div>
              <span className="font-semibold text-foreground">Welcome, {user?.name}!</span> Currently
              showing all {semesterCourses.length} curriculum courses for{" "}
              <strong>
                {userDept} Year {userYear}, Semester {userSem}
              </strong>
              . You can join your specific courses in the course directory.
            </div>
          </div>
          <Link to="/courses" className={buttonVariants({ size: "sm" })}>
            Browse courses
          </Link>
        </div>
      )}

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {TILES.map((tile) => (
          <StatTile key={tile.to} {...tile} />
        ))}
      </div>

      <div className="mb-6 grid gap-5 lg:grid-cols-[1.35fr_1fr]">
        <NextClassPanel next={next} loading={schedules.isLoading} />

        <Panel
          eyebrow="Today's Timetable"
          title={`${todayName}'s classes`}
          icon={CalendarDays}
          tone="amber"
          action={
            <Link to="/schedules" className="text-[13px] font-medium text-primary hover:underline">
              Full schedule
            </Link>
          }
        >
          {classesToday.length === 0 ? (
            <div className="py-4 text-center">
              <p className="text-[13px] font-medium text-foreground">No classes scheduled today</p>
              <p className="mt-1 text-[12px] text-muted-foreground">
                Enjoy your free time or catch up on coursework.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-ink/10">
              {classesToday.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge>{c.course}</Badge>
                      <span className="truncate text-[13px] font-semibold">{c.title}</span>
                    </div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground">
                      Room {c.room} · {c.instructor}
                    </div>
                  </div>
                  <span className="tnum shrink-0 font-mono text-[12px] font-medium text-[#8a6608]">
                    {c.start_time} - {c.end_time}
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
              All assignments
            </Link>
          }
        >
          {dueThisWeek.length === 0 ? (
            <div className="py-4 text-center">
              <CheckCircle2 className="mx-auto mb-1.5 h-6 w-6 text-ok" />
              <p className="text-[13px] font-medium text-foreground">All caught up!</p>
              <p className="mt-0.5 text-[12px] text-muted-foreground">
                No pending assignments due for your courses in the next 7 days.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-ink/10">
              {dueThisWeek.slice(0, 5).map((a) => {
                const left = daysUntil(a.deadline);
                return (
                  <li key={a.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge>{a.course}</Badge>
                        <Link
                          to={`/assignments/${a.id}`}
                          className="truncate text-[13px] font-medium hover:underline"
                        >
                          {a.title}
                        </Link>
                      </div>
                      <div className="mt-0.5 text-[11px] text-muted-foreground">
                        {a.marks} marks · via {a.submission_platform}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="tnum text-[11px] font-semibold text-[#8a6608]">
                        {a.deadline}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {left === 0 ? "due today" : `${left}d left`}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <Panel
          eyebrow="My work"
          title="Recent submissions & feedback"
          icon={ClipboardCheck}
          tone="green"
          action={
            <Link to="/submissions" className="text-[13px] font-medium text-primary hover:underline">
              View all
            </Link>
          }
        >
          {mySubmissions.length === 0 ? (
            <div className="py-4 text-center">
              <p className="text-[13px] font-medium text-foreground">No submissions yet</p>
              <p className="mt-1 text-[12px] text-muted-foreground">
                When you hand in assignments, review status and instructor feedback will appear here.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-ink/10">
              {mySubmissions.slice(0, 4).map((s) => (
                <li key={s.id} className="py-2.5 first:pt-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <StatusPill tone={SUBMISSION_TONE[s.status]}>
                        {SUBMISSION_LABEL[s.status]}
                      </StatusPill>
                      <span className="truncate text-[13px] font-medium">
                        {s.assignment_title}
                      </span>
                    </div>
                    {s.grade != null && (
                      <span className="tnum text-[12px] font-bold text-ok">
                        Grade: {s.grade}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>{s.course_code}</span>
                    <span>Handed in {formatMoment(s.submitted_at)}</span>
                  </div>
                  {s.feedback && (
                    <p className="mt-1.5 rounded bg-paper-deep/60 px-2.5 py-1.5 text-[12px] italic text-muted-foreground">
                      "{s.feedback}" — {s.reviewed_by}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel
          eyebrow="Campus Life"
          title="My registered events"
          icon={PartyPopper}
          tone="violet"
          action={
            <Link to="/events" className="text-[13px] font-medium text-primary hover:underline">
              Explore events
            </Link>
          }
        >
          {myRegisteredEvents.length === 0 ? (
            <div className="py-4 text-center">
              <p className="text-[13px] text-muted-foreground">
                You haven't registered for any campus events yet.
              </p>
              <Link
                to="/events"
                className={buttonVariants({ variant: "outline", size: "sm", className: "mt-3" })}
              >
                Browse upcoming events
              </Link>
            </div>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {myRegisteredEvents.map((e) => (
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
                    <div className="mt-2 flex items-center gap-1 text-[11px] font-medium text-ok">
                      <CheckCircle2 className="h-3 w-3" />
                      Registered
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          eyebrow="Announcements"
          title="Notices for you"
          icon={Megaphone}
          tone="ink"
          action={
            <Link
              to="/announcements"
              className="text-[13px] font-medium text-primary hover:underline"
            >
              View all
            </Link>
          }
        >
          {relevantAnnouncements.length === 0 ? (
            <p className="py-4 text-[13px] text-muted-foreground">Nothing urgent right now.</p>
          ) : (
            <ul className="divide-y divide-ink/10">
              {relevantAnnouncements.slice(0, 4).map((a) => (
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
    </>
  );
}
