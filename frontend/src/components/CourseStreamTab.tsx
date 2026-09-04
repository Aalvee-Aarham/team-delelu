import { Link } from "react-router-dom";
import { Megaphone, NotebookPen } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { StatusPill } from "@/components/StatusPill";
import { CommentThread } from "@/components/CommentThread";
import { PRIORITY_TONE, TONE_EDGE } from "@/lib/tone";
import { SUBMISSION_LABEL, SUBMISSION_TONE, deadlineLabel } from "@/lib/classroom.utils";
import type { Announcement, Assignment, Submission } from "@/lib/types";

type StreamItem =
  | { kind: "announcement"; at: string; announcement: Announcement }
  | { kind: "assignment"; at: string; assignment: Assignment };

export function CourseStreamTab({
  courseId,
  assignments,
  announcements,
  mySubmissions,
}: {
  courseId: string;
  assignments: Assignment[];
  announcements: Announcement[];
  mySubmissions: Map<string, Submission>;
}) {
  const items: StreamItem[] = [
    ...announcements.map((a) => ({ kind: "announcement" as const, at: a.date, announcement: a })),
    ...assignments.map((a) => ({ kind: "assignment" as const, at: a.assigned_date, assignment: a })),
  ].sort((a, b) => b.at.localeCompare(a.at));

  return (
    <div className="space-y-6">
      {items.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="Nothing posted yet"
          description="Notices and classwork for this course will appear here."
        />
      ) : (
        <div className="space-y-3">
          {items.map((item) =>
            item.kind === "announcement" ? (
              <article
                key={`ann-${item.announcement.id}`}
                className={`rounded-lg border border-ink/12 border-l-[3px] bg-card p-5 ${
                  TONE_EDGE[PRIORITY_TONE[item.announcement.priority] ?? "ink"]
                }`}
              >
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <StatusPill tone={PRIORITY_TONE[item.announcement.priority] ?? "ink"} icon={Megaphone}>
                    Notice
                  </StatusPill>
                  <span className="tnum text-[11px] text-muted-foreground">{item.announcement.date}</span>
                </div>
                <h3 className="text-[15px] font-semibold tracking-tight">{item.announcement.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                  {item.announcement.body}
                </p>
                <div className="mt-3 text-[11px] text-muted-foreground">
                  Posted by {item.announcement.posted_by}
                </div>
              </article>
            ) : (
              <Link
                key={`asg-${item.assignment.id}`}
                to={`/assignments/${item.assignment.id}`}
                className="block rounded-lg border border-ink/12 bg-card p-5 transition-colors hover:border-ink/25"
              >
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <StatusPill tone="blue" icon={NotebookPen}>
                    Assignment
                  </StatusPill>
                  {mySubmissions.has(item.assignment.id) && (
                    <StatusPill tone={SUBMISSION_TONE[mySubmissions.get(item.assignment.id)!.status]}>
                      {SUBMISSION_LABEL[mySubmissions.get(item.assignment.id)!.status]}
                    </StatusPill>
                  )}
                  <span className="tnum ml-auto text-[11px] text-muted-foreground">
                    Due {item.assignment.deadline} ·{" "}
                    {deadlineLabel(item.assignment.deadline, mySubmissions.has(item.assignment.id))}
                  </span>
                </div>
                <h3 className="text-[15px] font-semibold tracking-tight">{item.assignment.title}</h3>
                <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
                  {item.assignment.description}
                </p>
                <div className="tnum mt-3 text-[11px] text-muted-foreground">
                  {item.assignment.marks} marks
                </div>
              </Link>
            )
          )}
        </div>
      )}

      <CommentThread
        targetType="course"
        targetId={courseId}
        courseId={courseId}
        title="Class discussion"
      />
    </div>
  );
}
