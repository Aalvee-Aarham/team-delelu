import { CalendarDays, DoorOpen, UserRound, Users } from "lucide-react";
import type { ReactNode } from "react";
import { TONE_BAR, type Tone } from "@/lib/tone";
import type { Course } from "@/lib/types";

export function CourseBanner({ course, action }: { course: Course; action?: ReactNode }) {
  const tone = (course.accent as Tone) ?? "blue";

  return (
    <section className="relative mb-6 overflow-hidden rounded-lg border border-ink/12">
      {course.cover_url ? (
        <img src={course.cover_url} alt="" className="h-48 w-full object-cover sm:h-56" />
      ) : (
        <div className={`h-48 w-full sm:h-56 ${TONE_BAR[tone]}`} />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/45 to-ink/10" />

      <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-4 p-6">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold tracking-[0.09em] text-white/75 uppercase">
            {course.code} · {course.term}
          </div>
          <h1 className="mt-2 text-[26px] leading-tight font-bold tracking-tight text-white">
            {course.title}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] text-white/80">
            <span className="flex items-center gap-1.5">
              <UserRound className="h-3.5 w-3.5" />
              {course.instructor}
            </span>
            {course.room && (
              <span className="flex items-center gap-1.5">
                <DoorOpen className="h-3.5 w-3.5" />
                {course.room}
              </span>
            )}
            {course.section && (
              <span className="flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" />
                Section {course.section}
              </span>
            )}
            <span className="tnum flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              {course.enrolled.length} enrolled
            </span>
          </div>
        </div>
        {action}
      </div>
    </section>
  );
}
