import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, MapPin, CalendarDays } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { FormDialog } from "@/components/FormDialog";
import type { FieldDef, FormValues } from "@/components/FormDialog";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { useResourceList, useResourceMutations } from "@/hooks/useResource";
import { useAuth } from "@/context/AuthContext";
import { api, apiErrorMessage } from "@/lib/axios";
import type { CampusEvent } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const STATUSES = ["upcoming", "ongoing", "completed", "cancelled", "full"];

const FIELDS: FieldDef[] = [
  { name: "id", label: "ID", required: true, placeholder: "evt-008", hideOnEdit: true },
  { name: "name", label: "Event name", required: true },
  { name: "description", label: "Description", type: "textarea", required: true },
  { name: "date", label: "Date", type: "date", required: true },
  { name: "end_date", label: "End date", type: "date", required: true },
  { name: "start_time", label: "Start time (HH:MM)", required: true, placeholder: "09:00" },
  { name: "end_time", label: "End time (HH:MM)", required: true, placeholder: "17:00" },
  { name: "venue", label: "Venue", required: true, placeholder: "7C01" },
  { name: "organizer", label: "Organizer", required: true },
  { name: "capacity", label: "Capacity", type: "number", required: true },
  { name: "status", label: "Status", type: "select", options: STATUSES, required: true },
];

const TONE: Record<string, string> = {
  upcoming: "border-primary/40 bg-primary/10 text-primary",
  ongoing: "border-ok/40 bg-ok/10 text-ok",
  completed: "border-border bg-secondary text-muted-foreground",
  cancelled: "border-destructive/40 bg-destructive/10 text-destructive",
  full: "border-warn/40 bg-warn/10 text-warn",
};

export default function EventsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<CampusEvent | null>(null);
  const [deleting, setDeleting] = useState<CampusEvent | null>(null);

  const { data, isLoading } = useResourceList<CampusEvent>("events");
  const { create, update, remove } = useResourceMutations<CampusEvent>("events", "Event");

  const toggle = useMutation({
    mutationFn: async ({ id, registered }: { id: string; registered: boolean }) =>
      registered ? api.delete(`/events/${id}/register`) : api.post(`/events/${id}/register`),
    onSuccess: (_r, vars) => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast.success(vars.registered ? "Registration cancelled" : "You are registered");
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  const rows = [...(data ?? [])].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <>
      <PageHeader
        title="Events"
        subtitle="What is happening on campus."
        action={
          isAdmin && (
            <Button onClick={() => setCreating(true)} className="gap-2">
              <Plus className="h-4 w-4" /> Add event
            </Button>
          )
        }
      />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-52 w-full" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No events.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {rows.map((e) => {
            const mine = e.registrations.some((r) => r.student_id === user?.student_id);
            const pct = Math.min(100, Math.round((e.registered / e.capacity) * 100));
            const closed = e.status === "cancelled" || e.status === "completed";
            return (
              <div key={e.id} className="flex flex-col rounded-xl border border-border bg-card p-5">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <span className={`rounded-md border px-2 py-0.5 text-[11px] font-medium uppercase ${TONE[e.status]}`}>
                    {e.status}
                  </span>
                  {isAdmin && (
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setEditing(e)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleting(e)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  )}
                </div>

                <h3 className="font-medium">{e.name}</h3>
                <p className="mt-1 line-clamp-2 flex-1 text-sm text-muted-foreground">{e.description}</p>

                <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {e.date}
                    {e.end_date !== e.date && ` – ${e.end_date}`} · {e.start_time}–{e.end_time}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    {e.venue} · {e.organizer}
                  </div>
                </div>

                <div className="mt-3">
                  <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                    <span>
                      {e.registered} / {e.capacity} registered
                    </span>
                    <span>{pct}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                    <div
                      className={`h-full rounded-full transition-all ${pct >= 100 ? "bg-warn" : "bg-primary"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                <Button
                  className="mt-4 w-full"
                  variant={mine ? "outline" : "default"}
                  disabled={closed || toggle.isPending || (!mine && e.registered >= e.capacity)}
                  onClick={() => toggle.mutate({ id: e.id, registered: mine })}
                >
                  {mine ? "Cancel registration" : e.registered >= e.capacity ? "Full" : "Register"}
                </Button>
              </div>
            );
          })}
        </div>
      )}

      <FormDialog
        open={creating}
        onOpenChange={setCreating}
        title="Add an event"
        fields={FIELDS}
        submitting={create.isPending}
        onSubmit={(v: FormValues) =>
          create.mutate({ ...v, registered: 0, registrations: [] } as unknown as Partial<CampusEvent>, {
            onSuccess: () => setCreating(false),
          })
        }
      />

      <FormDialog
        open={Boolean(editing)}
        onOpenChange={(o) => !o && setEditing(null)}
        title="Edit event"
        fields={FIELDS}
        initial={editing ? (editing as unknown as FormValues) : undefined}
        submitting={update.isPending}
        onSubmit={(v: FormValues) =>
          editing && update.mutate({ id: editing.id, payload: v as Partial<CampusEvent> }, { onSuccess: () => setEditing(null) })
        }
      />

      <ConfirmDelete
        open={Boolean(deleting)}
        onOpenChange={(o) => !o && setDeleting(null)}
        label={deleting?.name ?? ""}
        pending={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.id, { onSuccess: () => setDeleting(null) })}
      />
    </>
  );
}
