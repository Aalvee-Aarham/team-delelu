import { useMemo, useState } from "react";
import { CornerDownRight, MessageSquare, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusPill } from "@/components/StatusPill";
import { useAuth } from "@/context/AuthContext";
import { useCommentMutations, useComments } from "@/hooks/useClassroom";
import { formatMoment, initials } from "@/lib/classroom.utils";
import type { Comment, CommentTarget } from "@/lib/types";

function Avatar({ name, role }: { name: string; role: Comment["author_role"] }) {
  return (
    <span
      className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11px] font-bold ${
        role === "admin" ? "bg-ink text-paper" : "bg-paper-deep text-ink"
      }`}
    >
      {initials(name)}
    </span>
  );
}

function CommentRow({
  comment,
  onDelete,
  canDelete,
  children,
}: {
  comment: Comment;
  onDelete: () => void;
  canDelete: boolean;
  children?: React.ReactNode;
}) {
  return (
    <li>
      <div className="flex gap-3">
        <Avatar name={comment.author_name} role={comment.author_role} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[13px] font-semibold">{comment.author_name}</span>
            {comment.author_role === "admin" && <StatusPill tone="ink">Instructor</StatusPill>}
            <span className="tnum text-[11px] text-muted-foreground">
              {formatMoment(comment.created_at)}
            </span>
            {canDelete && (
              <button
                type="button"
                aria-label="Delete comment"
                onClick={onDelete}
                className="ml-auto text-muted-foreground transition-colors hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <p className="mt-1 text-[13px] leading-relaxed whitespace-pre-wrap text-foreground/90">
            {comment.body}
          </p>
          {children}
        </div>
      </div>
    </li>
  );
}

export function CommentThread({
  targetType,
  targetId,
  courseId = "",
  title = "Class comments",
}: {
  targetType: CommentTarget;
  targetId: string;
  courseId?: string;
  title?: string;
}) {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const { data, isLoading } = useComments(targetType, targetId);
  const { post, remove } = useCommentMutations(targetType, targetId);
  const [draft, setDraft] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState("");

  const threads = useMemo(() => {
    const rows = data ?? [];
    const roots = rows.filter((c) => !c.parent_id);
    return roots.map((root) => ({
      root,
      replies: rows.filter((c) => c.parent_id === root.id),
    }));
  }, [data]);

  const canDelete = (comment: Comment) => isAdmin || comment.author_id === user?.student_id;

  const submitRoot = () => {
    if (!draft.trim()) return;
    post.mutate({ body: draft.trim(), course_id: courseId }, { onSuccess: () => setDraft("") });
  };

  const submitReply = (parentId: string) => {
    if (!replyDraft.trim()) return;
    post.mutate(
      { body: replyDraft.trim(), parent_id: parentId, course_id: courseId },
      {
        onSuccess: () => {
          setReplyDraft("");
          setReplyTo(null);
        },
      }
    );
  };

  return (
    <section className="rounded-lg border border-ink/12 bg-card">
      <header className="flex items-center gap-2 border-b border-ink/10 px-5 py-4">
        <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
        <h2 className="text-[15px] font-semibold tracking-tight">{title}</h2>
        <span className="tnum ml-auto text-[11px] text-muted-foreground">
          {(data ?? []).length} {(data ?? []).length === 1 ? "message" : "messages"}
        </span>
      </header>

      <div className="space-y-5 p-5">
        {isLoading ? (
          <Skeleton className="h-20 w-full" />
        ) : threads.length === 0 ? (
          <p className="text-[13px] text-muted-foreground">
            No comments yet. {isAdmin ? "Students can ask here and you can reply." : "Ask the instructor a question."}
          </p>
        ) : (
          <ul className="space-y-5">
            {threads.map(({ root, replies }) => (
              <CommentRow
                key={root.id}
                comment={root}
                canDelete={canDelete(root)}
                onDelete={() => remove.mutate(root.id)}
              >
                {replies.length > 0 && (
                  <ul className="mt-3 space-y-3 border-l-2 border-ink/10 pl-4">
                    {replies.map((reply) => (
                      <CommentRow
                        key={reply.id}
                        comment={reply}
                        canDelete={canDelete(reply)}
                        onDelete={() => remove.mutate(reply.id)}
                      />
                    ))}
                  </ul>
                )}

                {replyTo === root.id ? (
                  <div className="mt-3 space-y-2">
                    <Textarea
                      rows={2}
                      autoFocus
                      value={replyDraft}
                      placeholder={isAdmin ? "Reply as instructor…" : "Add to this thread…"}
                      onChange={(e) => setReplyDraft(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" disabled={post.isPending} onClick={() => submitReply(root.id)}>
                        <Send />
                        Reply
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setReplyTo(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setReplyTo(root.id);
                      setReplyDraft("");
                    }}
                    className="mt-2 inline-flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <CornerDownRight className="h-3 w-3" />
                    Reply
                  </button>
                )}
              </CommentRow>
            ))}
          </ul>
        )}

        <div className="space-y-2 border-t border-ink/10 pt-5">
          <Textarea
            rows={3}
            value={draft}
            placeholder={isAdmin ? "Post a note to the class…" : "Ask a question about this…"}
            onChange={(e) => setDraft(e.target.value)}
          />
          <Button size="sm" disabled={post.isPending || !draft.trim()} onClick={submitRoot}>
            <Send />
            {isAdmin ? "Post to class" : "Post comment"}
          </Button>
        </div>
      </div>
    </section>
  );
}
