import { Link } from "react-router-dom";
import { NotebookPen, Users } from "lucide-react";
import { RowActions } from "@/components/RowActions";
import { StatusPill } from "@/components/StatusPill";
import { TONE_BAR, type Tone } from "@/lib/tone";
import type { Course } from "@/lib/types";

export function CourseCard({
  course,
  assignmentCount,
  dueCount,
  joined,
  isAdmin,
  onEdit,
  onDelete,
}: {
  course: Course;
  assignmentCount: number;
  dueCount: number;
  joined: boolean;
  isAdmin: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const tone = (course.accent as Tone) ?? "blue";

  return (
    <article className="group flex flex-col overflow-hidden rounded-lg border border-ink/12 bg-card">
      <Link to={`/courses/${course.id}`} className="relative block h-32 overflow-hidden">
        {course.cover_url ? (
          <img
            src={course.cover_url}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
          />
        ) : (
          <div className={`h-full w-full ${TONE_BAR[tone]} opacity-80`} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/25 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-4">
          <div className="text-[11px] font-semibold tracking-[0.09em] text-white/80 uppercase">
            {course.code} · {course.section || course.term}
          </div>
          <h3 className="mt-1 line-clamp-2 text-[15px] leading-tight font-semibold text-white">
            {course.title}
          </h3>
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <p className="line-clamp-2 flex-1 text-[13px] leading-relaxed text-muted-foreground">
            {course.description}
          </p>
          {isAdmin && <RowActions label={course.title} onEdit={onEdit} onDelete={onDelete} />}
        </div>

        <div className="mt-3 text-[12px] text-muted-foreground">{course.instructor}</div>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-ink/10 pt-3 text-[11px] text-muted-foreground">
          <span className="tnum flex items-center gap-1.5">
            <NotebookPen className="h-3 w-3" />
            {assignmentCount} classwork
          </span>
          <span className="tnum flex items-center gap-1.5">
            <Users className="h-3 w-3" />
            {course.enrolled.length} enrolled
          </span>
          {dueCount > 0 && (
            <StatusPill tone="amber" className="ml-auto">
              {dueCount} due
            </StatusPill>
          )}
          {joined && dueCount === 0 && (
            <StatusPill tone="green" className="ml-auto">
              Joined
            </StatusPill>
          )}
        </div>
      </div>
    </article>
  );
}
