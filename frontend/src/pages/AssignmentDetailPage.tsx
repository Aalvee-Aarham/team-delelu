import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ClipboardCheck, NotebookPen, Send } from "lucide-react";
import { Panel } from "@/components/Panel";
import { StatusPill } from "@/components/StatusPill";
import { EmptyState } from "@/components/EmptyState";
import { AttachmentList } from "@/components/AttachmentList";
import { CommentThread } from "@/components/CommentThread";
import { SubmitWorkPanel } from "@/components/SubmitWorkPanel";
import { SubmissionReviewCard } from "@/components/SubmissionReviewCard";
import { useResourceList } from "@/hooks/useResource";
import { useSubmissions } from "@/hooks/useClassroom";
import { useAuth } from "@/context/AuthContext";
import { deadlineLabel } from "@/lib/classroom.utils";
import type { Assignment, Course } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function AssignmentDetailPage() {
  const { assignmentId } = useParams();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const { data: assignments, isLoading } = useResourceList<Assignment>("assignments");
  const { data: courses } = useResourceList<Course>("courses");
  const { data: submissions } = useSubmissions({ assignment_id: assignmentId });

  const assignment = useMemo(
    () => (assignments ?? []).find((a) => a.id === assignmentId),
    [assignments, assignmentId]
  );
  const course = useMemo(
    () => (courses ?? []).find((c) => c.id === assignment?.course_id || c.code === assignment?.course),
    [courses, assignment]
  );

  const mine = (submissions ?? []).find((s) => s.student_id === user?.student_id);
  const pending = (submissions ?? []).filter((s) => s.status === "submitted");

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!assignment) {
    return (
      <EmptyState
        icon={NotebookPen}
        title="Assignment not found"
        description="It may have been deleted. Head back to the assignment list."
      />
    );
  }

  return (
    <>
      <Link
        to={course ? `/courses/${course.id}` : "/assignments"}
        className="mb-5 inline-flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {course ? course.code : "All assignments"}
      </Link>

      <div className="mb-7">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Badge>{assignment.course}</Badge>
          <span className="tnum text-[11px] text-muted-foreground">{assignment.marks} marks</span>
          <span className="tnum text-[11px] text-muted-foreground">
            Assigned {assignment.assigned_date}
          </span>
          <StatusPill tone="amber" className="ml-auto">
            {deadlineLabel(assignment.deadline, Boolean(mine))}
          </StatusPill>
        </div>
        <h1 className="text-[28px] leading-tight font-bold tracking-tight">{assignment.title}</h1>
        <p className="mt-3 max-w-2xl text-[13px] leading-relaxed text-muted-foreground">
          {assignment.course_title}
        </p>
        <div className="rule-dotted mt-6 h-px w-full" />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.15fr_1fr]">
        <div className="space-y-5">
          <Panel eyebrow="Instructions" title="What to do" icon={NotebookPen} tone="blue">
            <p className="text-[13px] leading-relaxed whitespace-pre-wrap">{assignment.description}</p>
            <div className="mt-4 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Send className="h-3 w-3" />
              Submission platform: {assignment.submission_platform}
            </div>
            {assignment.attachments?.length > 0 && (
              <div className="mt-4 border-t border-ink/10 pt-4">
                <div className="eyebrow mb-2.5 text-muted-foreground">Reference material</div>
                <AttachmentList attachments={assignment.attachments} />
              </div>
            )}
          </Panel>

          <CommentThread
            targetType="assignment"
            targetId={assignment.id}
            courseId={assignment.course_id}
          />
        </div>

        <div className="space-y-5">
          {isAdmin ? (
            <Panel
              eyebrow="Review"
              title="Submitted work"
              description={`${(submissions ?? []).length} handed in, ${pending.length} awaiting a decision.`}
              icon={ClipboardCheck}
              tone={pending.length > 0 ? "amber" : "green"}
              bodyClassName="space-y-3 p-5"
            >
              {(submissions ?? []).length === 0 ? (
                <p className="text-[13px] text-muted-foreground">
                  Nothing has been handed in for this assignment yet.
                </p>
              ) : (
                (submissions ?? []).map((s) => (
                  <SubmissionReviewCard key={s.id} submission={s} totalMarks={assignment.marks} />
                ))
              )}
            </Panel>
          ) : (
            <SubmitWorkPanel assignment={assignment} submission={mine} />
          )}
        </div>
      </div>
    </>
  );
}
