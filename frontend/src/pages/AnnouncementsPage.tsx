import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { FormDialog } from "@/components/FormDialog";
import type { FieldDef, FormValues } from "@/components/FormDialog";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { useResourceList, useResourceMutations } from "@/hooks/useResource";
import { useAuth } from "@/context/AuthContext";
import type { Announcement } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const PRIORITIES = ["high", "medium", "low"];
const RANK: Record<string, number> = { high: 0, medium: 1, low: 2 };

const FIELDS: FieldDef[] = [
  { name: "id", label: "ID", required: true, placeholder: "ann-009", hideOnEdit: true },
  { name: "title", label: "Title", required: true },
  { name: "body", label: "Body", type: "textarea", required: true },
  { name: "date", label: "Date posted", type: "date", required: true },
  { name: "priority", label: "Priority", type: "select", options: PRIORITIES, required: true },
  { name: "posted_by", label: "Posted by", required: true },
  { name: "expires", label: "Expires", type: "date", required: true },
];

const TONE: Record<string, string> = {
  high: "border-destructive/40 bg-destructive/10 text-destructive",
  medium: "border-warn/40 bg-warn/10 text-warn",
  low: "border-border bg-secondary text-muted-foreground",
};

export default function AnnouncementsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [priority, setPriority] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [deleting, setDeleting] = useState<Announcement | null>(null);

  const { data, isLoading } = useResourceList<Announcement>("announcements", { priority: priority || undefined });
  const { create, update, remove } = useResourceMutations<Announcement>("announcements", "Announcement");

  const today = new Date().toISOString().slice(0, 10);
  const rows = useMemo(
    () => [...(data ?? [])].sort((a, b) => RANK[a.priority] - RANK[b.priority] || b.date.localeCompare(a.date)),
    [data]
  );

  return (
    <>
      <PageHeader
        title="Announcements"
        subtitle="Campus notices, newest and highest priority first."
        action={
          isAdmin && (
            <Button onClick={() => setCreating(true)} className="gap-2">
              <Plus className="h-4 w-4" /> Post notice
            </Button>
          )
        }
      />

      <div className="mb-4 flex gap-2">
        <Button variant={priority === "" ? "default" : "outline"} size="sm" onClick={() => setPriority("")}>
          All
        </Button>
        {PRIORITIES.map((p) => (
          <Button key={p} variant={priority === p ? "default" : "outline"} size="sm" onClick={() => setPriority(p)}>
            {p}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No announcements.
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((a) => {
            const expired = a.expires < today;
            return (
              <div
                key={a.id}
                className={`rounded-xl border border-border bg-card p-5 transition-opacity ${expired ? "opacity-55" : ""}`}
              >
                <div className="mb-2 flex items-start justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-md border px-2 py-0.5 text-[11px] font-medium uppercase ${TONE[a.priority]}`}>
                      {a.priority}
                    </span>
                    {expired && (
                      <span className="rounded-md border border-border bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground">
                        expired
                      </span>
                    )}
                    <h3 className="font-medium">{a.title}</h3>
                  </div>
                  {isAdmin && (
                    <div className="flex shrink-0 gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setEditing(a)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleting(a)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  )}
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">{a.body}</p>
                <div className="mt-3 flex flex-wrap gap-x-4 text-xs text-muted-foreground">
                  <span>{a.posted_by}</span>
                  <span>Posted {a.date}</span>
                  <span>Expires {a.expires}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <FormDialog
        open={creating}
        onOpenChange={setCreating}
        title="Post an announcement"
        fields={FIELDS}
        submitting={create.isPending}
        onSubmit={(v: FormValues) => create.mutate(v as Partial<Announcement>, { onSuccess: () => setCreating(false) })}
      />

      <FormDialog
        open={Boolean(editing)}
        onOpenChange={(o) => !o && setEditing(null)}
        title="Edit announcement"
        fields={FIELDS}
        initial={editing ? (editing as unknown as FormValues) : undefined}
        submitting={update.isPending}
        onSubmit={(v: FormValues) =>
          editing && update.mutate({ id: editing.id, payload: v as Partial<Announcement> }, { onSuccess: () => setEditing(null) })
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
