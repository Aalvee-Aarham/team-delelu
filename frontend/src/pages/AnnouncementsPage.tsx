import { useMemo, useState } from "react";
import { CalendarClock, Megaphone, MessageSquare, Plus, UserRound } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { FormDialog } from "@/components/FormDialog";
import type { FieldDef, FormValues } from "@/components/FormDialog";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { FilterTabs } from "@/components/FilterTabs";
import { RowActions } from "@/components/RowActions";
import { EmptyState } from "@/components/EmptyState";
import { StatusPill } from "@/components/StatusPill";
import { useResourceList, useResourceMutations } from "@/hooks/useResource";
import { CommentThread } from "@/components/CommentThread";
import { useAuth } from "@/context/AuthContext";
import type { Announcement, Course } from "@/lib/types";
import { PRIORITY_TONE, TONE_EDGE } from "@/lib/tone";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const PRIORITIES = ["high", "medium", "low"];
const RANK: Record<string, number> = { high: 0, medium: 1, low: 2 };

const FIELDS: FieldDef[] = [
  { name: "id", label: "ID", required: true, placeholder: "ann-009", hideOnEdit: true },
  { name: "course_id", label: "Course (blank for a campus-wide notice)", type: "select", options: [] },
  { name: "title", label: "Title", required: true },
  { name: "body", label: "Body", type: "textarea", required: true },
  { name: "date", label: "Date posted", type: "date", required: true },
  { name: "priority", label: "Priority", type: "select", options: PRIORITIES, required: true },
  { name: "posted_by", label: "Posted by", required: true },
  { name: "expires", label: "Expires", type: "date", required: true },
];

export default function AnnouncementsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [priority, setPriority] = useState("");
  const [discussing, setDiscussing] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [deleting, setDeleting] = useState<Announcement | null>(null);

  const { data, isLoading } = useResourceList<Announcement>("announcements", {
    priority: priority || undefined,
  });
  const { data: courses } = useResourceList<Course>("courses");
  const { create, update, remove } = useResourceMutations<Announcement>(
    "announcements",
    "Announcement"
  );

  const fields = useMemo(
    () =>
      FIELDS.map((f) =>
        f.name === "course_id" ? { ...f, options: (courses ?? []).map((c) => c.id) } : f
      ),
    [courses]
  );

  const courseName = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of courses ?? []) map.set(c.id, c.code);
    return map;
  }, [courses]);

  const today = new Date().toISOString().slice(0, 10);
  const rows = useMemo(
    () =>
      [...(data ?? [])].sort(
        (a, b) => RANK[a.priority] - RANK[b.priority] || b.date.localeCompare(a.date)
      ),
    [data]
  );

  return (
    <>
      <PageHeader
        eyebrow="Campus"
        title="Announcements"
        subtitle="Campus notices, highest priority and newest first. Expired notices stay visible but dimmed."
        action={
          isAdmin && (
            <Button onClick={() => setCreating(true)}>
              <Plus />
              Post notice
            </Button>
          )
        }
      />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <FilterTabs
          value={priority}
          onChange={setPriority}
          options={[
            { value: "", label: "All" },
            ...PRIORITIES.map((p) => ({ value: p, label: p })),
          ]}
        />
        <span className="eyebrow text-muted-foreground">
          {rows.length} {rows.length === 1 ? "notice" : "notices"}
        </span>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="No announcements"
          description="Nothing has been posted for this filter yet."
        />
      ) : (
        <div className="space-y-3">
          {rows.map((a) => {
            const expired = a.expires < today;
            const tone = PRIORITY_TONE[a.priority] ?? "ink";
            return (
              <article
                key={a.id}
                className={`rounded-lg border border-ink/12 border-l-[3px] bg-card p-5 transition-opacity ${TONE_EDGE[tone]} ${
                  expired ? "opacity-60" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <StatusPill tone={tone}>{a.priority}</StatusPill>
                      {expired && <StatusPill tone="ink">expired</StatusPill>}
                      {a.course_id && courseName.has(a.course_id) && (
                        <StatusPill tone="blue">{courseName.get(a.course_id)}</StatusPill>
                      )}
                    </div>
                    <h3 className="text-[15px] font-semibold tracking-tight">{a.title}</h3>
                  </div>
                  {isAdmin && (
                    <RowActions
                      label={a.title}
                      onEdit={() => setEditing(a)}
                      onDelete={() => setDeleting(a)}
                    />
                  )}
                </div>

                <p className="mt-2.5 text-[13px] leading-relaxed text-muted-foreground">{a.body}</p>

                <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-ink/10 pt-3 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <UserRound className="h-3 w-3" />
                    {a.posted_by}
                  </span>
                  <span className="tnum flex items-center gap-1.5">
                    <CalendarClock className="h-3 w-3" />
                    Posted {a.date}
                  </span>
                  <span className="tnum">Expires {a.expires}</span>
                  <button
                    type="button"
                    onClick={() => setDiscussing(discussing === a.id ? null : a.id)}
                    className="ml-auto inline-flex items-center gap-1.5 font-medium transition-colors hover:text-foreground"
                  >
                    <MessageSquare className="h-3 w-3" />
                    {discussing === a.id ? "Hide comments" : "Comments"}
                  </button>
                </div>

                {discussing === a.id && (
                  <div className="mt-4">
                    <CommentThread
                      targetType="announcement"
                      targetId={a.id}
                      courseId={a.course_id}
                      title="Notice discussion"
                    />
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      <FormDialog
        open={creating}
        onOpenChange={setCreating}
        title="Post an announcement"
        description="Leave the course blank for a campus-wide notice, or pick one to post it into that class stream."
        fields={fields}
        submitting={create.isPending}
        onSubmit={(v: FormValues) =>
          create.mutate(v as Partial<Announcement>, { onSuccess: () => setCreating(false) })
        }
      />

      <FormDialog
        open={Boolean(editing)}
        onOpenChange={(o) => !o && setEditing(null)}
        title="Edit announcement"
        fields={fields}
        initial={editing ? (editing as unknown as FormValues) : undefined}
        submitting={update.isPending}
        onSubmit={(v: FormValues) =>
          editing &&
          update.mutate(
            { id: editing.id, payload: v as Partial<Announcement> },
            { onSuccess: () => setEditing(null) }
          )
        }
      />

      <ConfirmDelete
        open={Boolean(deleting)}
        onOpenChange={(o) => !o && setDeleting(null)}
        label={deleting?.title ?? ""}
        pending={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.id, { onSuccess: () => setDeleting(null) })}
      />
    </>
  );
}
