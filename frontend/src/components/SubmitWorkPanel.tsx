import { useEffect, useState } from "react";
import { CheckCircle2, Clock, RotateCcw, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Panel } from "@/components/Panel";
import { StatusPill } from "@/components/StatusPill";
import { FilePicker } from "@/components/FilePicker";
import { AttachmentList } from "@/components/AttachmentList";
import { useSubmitWork, useUploadConfig, useWithdrawWork } from "@/hooks/useClassroom";
import { SUBMISSION_LABEL, SUBMISSION_TONE, deadlineLabel, formatMoment } from "@/lib/classroom.utils";
import type { Assignment, Attachment, Submission } from "@/lib/types";

export function SubmitWorkPanel({
  assignment,
  submission,
}: {
  assignment: Assignment;
  submission?: Submission;
}) {
  const { data: config } = useUploadConfig();
  const submit = useSubmitWork();
  const withdraw = useWithdrawWork();
  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  useEffect(() => {
    setText(submission?.text ?? "");
    setAttachments(submission?.attachments ?? []);
  }, [submission?.id, submission?.text, submission?.attachments]);

  const locked = submission?.status === "accepted" || submission?.status === "rejected";
  const empty = !text.trim() && attachments.length === 0;

  return (
    <Panel
      eyebrow="Your work"
      title={submission ? SUBMISSION_LABEL[submission.status] : "Not turned in yet"}
      icon={submission ? CheckCircle2 : Clock}
      tone={submission ? SUBMISSION_TONE[submission.status] : "amber"}
      action={
        <div className="text-right">
          <div className="eyebrow text-muted-foreground">Deadline</div>
          <div className="tnum mt-1 text-[13px] font-semibold">{assignment.deadline}</div>
          <div className="tnum text-[11px] text-muted-foreground">
            {deadlineLabel(assignment.deadline, Boolean(submission))}
          </div>
        </div>
      }
      bodyClassName="space-y-5 p-5"
    >
      {submission && (
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill tone={SUBMISSION_TONE[submission.status]}>
            {SUBMISSION_LABEL[submission.status]}
          </StatusPill>
          {submission.late && <StatusPill tone="red">Late</StatusPill>}
          <span className="tnum text-[11px] text-muted-foreground">
            Handed in {formatMoment(submission.submitted_at)}
          </span>
          {submission.grade != null && (
            <span className="tnum ml-auto text-[13px] font-semibold">
              {submission.grade} / {assignment.marks}
            </span>
          )}
        </div>
      )}

      {submission?.feedback && (
        <div className="rounded-md border border-ink/12 bg-paper-deep/50 p-3.5">
          <div className="eyebrow text-muted-foreground">
            Instructor feedback{submission.reviewed_by ? ` · ${submission.reviewed_by}` : ""}
          </div>
          <p className="mt-1.5 text-[13px] leading-relaxed">{submission.feedback}</p>
        </div>
      )}

      {locked ? (
        <div className="space-y-4">
          {submission?.text && (
            <p className="rounded-md border border-ink/12 bg-paper-deep/40 p-3.5 text-[13px] leading-relaxed whitespace-pre-wrap">
              {submission.text}
            </p>
          )}
          <AttachmentList attachments={submission?.attachments ?? []} />
          <p className="text-[12px] text-muted-foreground">
            This submission has been reviewed and is locked. Contact your instructor to reopen it.
          </p>
        </div>
      ) : (
        <>
          {assignment.accepts_text !== false && (
            <div className="grid gap-2">
              <label htmlFor="answer" className="eyebrow text-muted-foreground">
                Written answer
              </label>
              <Textarea
                id="answer"
                rows={5}
                value={text}
                placeholder="Type your answer, notes on your approach, or a link to your repository…"
                onChange={(e) => setText(e.target.value)}
              />
            </div>
          )}

          {assignment.accepts_files !== false && (
            <FilePicker
              attachments={attachments}
              onChange={setAttachments}
              maxMb={config?.maxMb ?? 16}
              provider={config?.submissions ?? "local"}
            />
          )}

          <div className="flex flex-wrap gap-2">
            <Button
              disabled={submit.isPending || empty}
              onClick={() => submit.mutate({ assignment_id: assignment.id, text, attachments })}
            >
              <Send />
              {submission ? "Resubmit" : "Hand in"}
            </Button>
            {submission && (
              <Button
                variant="outline"
                disabled={withdraw.isPending}
                onClick={() => withdraw.mutate(submission.id)}
              >
                <RotateCcw />
                Withdraw
              </Button>
            )}
          </div>
        </>
      )}
    </Panel>
  );
}
