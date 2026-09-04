import { useState } from "react";
import { Check, Undo2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { StatusPill } from "@/components/StatusPill";
import { AttachmentList } from "@/components/AttachmentList";
import { useReviewSubmission } from "@/hooks/useClassroom";
import { useAuth } from "@/context/AuthContext";
import { SUBMISSION_LABEL, SUBMISSION_TONE, formatMoment, initials } from "@/lib/classroom.utils";
import type { Submission } from "@/lib/types";

export function SubmissionReviewCard({
  submission,
  totalMarks,
  showAssignment = false,
}: {
  submission: Submission;
  totalMarks: number;
  showAssignment?: boolean;
}) {
  const { user } = useAuth();
  const canReview = user?.role === "admin";
  const review = useReviewSubmission();
  const [open, setOpen] = useState(false);
  const [grade, setGrade] = useState(submission.grade == null ? "" : String(submission.grade));
  const [feedback, setFeedback] = useState(submission.feedback);

  const decide = (status: Submission["status"]) =>
    review.mutate(
      {
        id: submission.id,
        status,
        grade: grade === "" ? null : Number(grade),
        feedback,
      },
      { onSuccess: () => setOpen(false) }
    );

  return (
    <article className="rounded-lg border border-ink/12 bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-paper-deep text-[12px] font-bold">
            {initials(submission.student_name)}
          </span>
          <div className="min-w-0">
            <h3 className="text-[15px] font-semibold tracking-tight">{submission.student_name}</h3>
            <div className="tnum mt-0.5 text-[11px] text-muted-foreground">
              {submission.student_id} · handed in {formatMoment(submission.submitted_at)}
            </div>
            {showAssignment && (
              <div className="mt-1 text-[12px] text-muted-foreground">
                {submission.course_code} · {submission.assignment_title}
              </div>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {submission.late && <StatusPill tone="red">Late</StatusPill>}
          <StatusPill tone={SUBMISSION_TONE[submission.status]}>
            {SUBMISSION_LABEL[submission.status]}
          </StatusPill>
          {submission.grade != null && (
            <span className="tnum text-[13px] font-semibold">
              {submission.grade} / {totalMarks}
            </span>
          )}
        </div>
      </div>

      {submission.text && (
        <p className="mt-4 rounded-md border border-ink/12 bg-paper-deep/40 p-3.5 text-[13px] leading-relaxed whitespace-pre-wrap">
          {submission.text}
        </p>
      )}

      {submission.attachments.length > 0 && (
        <div className="mt-4">
          <AttachmentList attachments={submission.attachments} />
        </div>
      )}

      {submission.feedback && !open && (
        <div className="mt-4 rounded-md border border-ink/12 bg-paper-deep/50 p-3.5">
          <div className="eyebrow text-muted-foreground">
            {canReview ? "Your feedback" : "Instructor feedback"}
            {submission.reviewed_at ? ` · ${formatMoment(submission.reviewed_at)}` : ""}
          </div>
          <p className="mt-1.5 text-[13px] leading-relaxed">{submission.feedback}</p>
        </div>
      )}

      {!canReview ? null : open ? (
        <div className="mt-4 space-y-3 border-t border-ink/10 pt-4">
          <div className="grid gap-2 sm:max-w-40">
            <label htmlFor={`grade-${submission.id}`} className="eyebrow text-muted-foreground">
              Grade (of {totalMarks})
            </label>
            <Input
              id={`grade-${submission.id}`}
              type="number"
              min={0}
              max={totalMarks}
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
            />
          </div>
          <Textarea
            rows={3}
            value={feedback}
            placeholder="What was good, what needs fixing…"
            onChange={(e) => setFeedback(e.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            <Button size="sm" disabled={review.isPending} onClick={() => decide("accepted")}>
              <Check />
              Accept
            </Button>
            <Button size="sm" variant="outline" disabled={review.isPending} onClick={() => decide("returned")}>
              <Undo2 />
              Return for edits
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={review.isPending}
              className="hover:bg-destructive/10 hover:text-destructive"
              onClick={() => decide("rejected")}
            >
              <X />
              Reject
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button size="sm" variant="outline" className="mt-4" onClick={() => setOpen(true)}>
          {submission.status === "submitted" ? "Review submission" : "Change decision"}
        </Button>
      )}
    </article>
  );
}
