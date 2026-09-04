import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { FormDialog } from "@/components/FormDialog";
import type { FieldDef, FormValues } from "@/components/FormDialog";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { useResourceList, useResourceMutations } from "@/hooks/useResource";
import { useAuth } from "@/context/AuthContext";
import type { Assignment } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const STATUSES = ["pending", "submitted", "graded", "late"];

const FIELDS: FieldDef[] = [
  { name: "id", label: "ID", required: true, placeholder: "asgn-009", hideOnEdit: true },
  { name: "course", label: "Course code", required: true, placeholder: "CSE 4113" },
  { name: "course_title", label: "Course title", required: true },
  { name: "title", label: "Assignment title", required: true },
  { name: "description", label: "Description", type: "textarea", required: true },
  { name: "assigned_date", label: "Assigned date", type: "date", required: true },
  { name: "deadline", label: "Deadline", type: "date", required: true },
  { name: "submission_platform", label: "Submission platform", required: true },
  { name: "status", label: "Status", type: "select", options: STATUSES, required: true },
  { name: "marks", label: "Marks", type: "number", required: true },
];

const TONE: Record<string, string> = {
  pending: "border-warn/40 bg-warn/10 text-warn",
  submitted: "border-primary/40 bg-primary/10 text-primary",
  graded: "border-ok/40 bg-ok/10 text-ok",
  late: "border-destructive/40 bg-destructive/10 text-destructive",
};

export default function AssignmentsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [status, setStatus] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Assignment | null>(null);
  const [deleting, setDeleting] = useState<Assignment | null>(null);

  const { data, isLoading } = useResourceList<Assignment>("assignments", { status: status || undefined });
  const { create, update, remove } = useResourceMutations<Assignment>("assignments", "Assignment");

  const today = new Date().toISOString().slice(0, 10);
  const rows = useMemo(() => [...(data ?? [])].sort((a, b) => a.deadline.localeCompare(b.deadline)), [data]);

  const daysLeft = (deadline: string) =>
    Math.round((Date.parse(deadline) - Date.parse(today)) / 86400000);

  return (
    <>
      <PageHeader
        title="Assignments"
        subtitle="Sorted by deadline, soonest first."
        action={
          isAdmin && (
            <Button onClick={() => setCreating(true)} className="gap-2">
              <Plus className="h-4 w-4" /> Add assignment
            </Button>
          )
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <Button variant={status === "" ? "default" : "outline"} size="sm" onClick={() => setStatus("")}>
          All
        </Button>
        {STATUSES.map((s) => (
          <Button key={s} variant={status === s ? "default" : "outline"} size="sm" onClick={() => setStatus(s)}>
            {s}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No assignments.
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((a) => {
            const left = daysLeft(a.deadline);
            const overdue = left < 0 && a.status === "pending";
            return (
              <div key={a.id} className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span className="rounded bg-secondary px-1.5 py-0.5 text-[11px] font-medium">{a.course}</span>
                      <span className={`rounded-md border px-2 py-0.5 text-[11px] font-medium uppercase ${TONE[a.status]}`}>
                        {a.status}
                      </span>
                      <span className="text-xs text-muted-foreground">{a.marks} marks</span>
                    </div>
                    <h3 className="font-medium">{a.title}</h3>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{a.description}</p>
                    <div className="mt-2 text-xs text-muted-foreground">Submit via {a.submission_platform}</div>
                  </div>

                  <div className="flex shrink-0 items-start gap-2">
                    <div className="text-right">
                      <div className="text-sm font-medium tabular-nums">{a.deadline}</div>
                      <div className={`text-xs ${overdue ? "text-destructive" : left <= 3 ? "text-warn" : "text-muted-foreground"}`}>
                        {overdue ? `${Math.abs(left)}d overdue` : left === 0 ? "due today" : `${left}d left`}
                      </div>
                    </div>
                    {isAdmin && (
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setEditing(a)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleting(a)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <FormDialog
        open={creating}
        onOpenChange={setCreating}
        title="Add an assignment"
        fields={FIELDS}
        submitting={create.isPending}
        onSubmit={(v: FormValues) => create.mutate(v as Partial<Assignment>, { onSuccess: () => setCreating(false) })}
      />

      <FormDialog
        open={Boolean(editing)}
        onOpenChange={(o) => !o && setEditing(null)}
        title="Edit assignment"
        fields={FIELDS}
        initial={editing ? (editing as unknown as FormValues) : undefined}
        submitting={update.isPending}
        onSubmit={(v: FormValues) =>
          editing && update.mutate({ id: editing.id, payload: v as Partial<Assignment> }, { onSuccess: () => setEditing(null) })
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
