import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CalendarDays, MapPin, MessageSquare, PartyPopper, Plus, Users } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { FormDialog } from "@/components/FormDialog";
import type { FieldDef, FormValues } from "@/components/FormDialog";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { FilterTabs } from "@/components/FilterTabs";
import { RowActions } from "@/components/RowActions";
import { EmptyState } from "@/components/EmptyState";
import { StatusPill } from "@/components/StatusPill";
import { Meter } from "@/components/Meter";
import { useResourceList, useResourceMutations } from "@/hooks/useResource";
import { useUploadConfig } from "@/hooks/useClassroom";
import { ImagePicker } from "@/components/ImagePicker";
import { CommentThread } from "@/components/CommentThread";
import { useAuth } from "@/context/AuthContext";
import { api, apiErrorMessage } from "@/lib/axios";
import type { CampusEvent } from "@/lib/types";
import { EVENT_TONE } from "@/lib/tone";
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
  { name: "image_credit", label: "Image credit", placeholder: "Unsplash" },
];

export default function EventsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const queryClient = useQueryClient();
  const { data: uploadConfig } = useUploadConfig();
  const [status, setStatus] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<CampusEvent | null>(null);
  const [deleting, setDeleting] = useState<CampusEvent | null>(null);
  const [discussing, setDiscussing] = useState<string | null>(null);
  const [cover, setCover] = useState("");
  const [coverProvider, setCoverProvider] = useState<CampusEvent["image_provider"]>("unsplash");

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

  const openCreate = () => {
    setCover("");
    setCoverProvider("unsplash");
    setCreating(true);
  };

  const openEdit = (event: CampusEvent) => {
    setCover(event.image_url);
    setCoverProvider(event.image_provider ?? "unsplash");
    setEditing(event);
  };

  const rows = useMemo(
    () =>
      [...(data ?? [])]
        .filter((e) => !status || e.status === status)
        .sort((a, b) => a.date.localeCompare(b.date)),
    [data, status]
  );

  return (
    <>
      <PageHeader
        eyebrow="Campus"
        title="Events"
        subtitle="What is happening on campus, with live registration counts against capacity."
        action={
          isAdmin && (
            <Button onClick={openCreate}>
              <Plus />
              Add event
            </Button>
          )
        }
      />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <FilterTabs
          value={status}
          onChange={setStatus}
          options={[{ value: "", label: "All" }, ...STATUSES.map((s) => ({ value: s, label: s }))]}
        />
        <span className="eyebrow text-muted-foreground">
          {rows.length} {rows.length === 1 ? "event" : "events"}
        </span>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-60 w-full" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={PartyPopper}
          title="No events"
          description="Nothing matches this filter right now."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {rows.map((e) => {
            const mine = e.registrations.some((r) => r.student_id === user?.student_id);
            const closed = e.status === "cancelled" || e.status === "completed";
            const full = e.registered >= e.capacity;
            const tone = EVENT_TONE[e.status] ?? "ink";
            const pct = e.capacity > 0 ? Math.round((e.registered / e.capacity) * 100) : 0;

            return (
              <article
                key={e.id}
                className="flex flex-col overflow-hidden rounded-lg border border-ink/12 bg-card"
              >
                <div className="relative h-40 overflow-hidden bg-paper-deep">
                  {e.image_url ? (
                    <img src={e.image_url} alt="" loading="lazy" className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-muted-foreground">
                      <PartyPopper className="h-6 w-6" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent" />
                  <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-3">
                    <StatusPill tone={tone} className="bg-card/90 backdrop-blur">
                      {e.status}
                    </StatusPill>
                    {isAdmin && (
                      <span className="rounded bg-card/90 backdrop-blur">
                        <RowActions
                          label={e.name}
                          onEdit={() => openEdit(e)}
                          onDelete={() => setDeleting(e)}
                        />
                      </span>
                    )}
                  </div>
                  {e.image_credit && (
                    <span className="absolute right-3 bottom-2 text-[10px] text-white/70">
                      {e.image_credit}
                    </span>
                  )}
                </div>

                <div className="flex flex-1 flex-col p-5">
                <h3 className="text-[15px] font-semibold tracking-tight">{e.name}</h3>
                <p className="mt-1.5 line-clamp-2 flex-1 text-[13px] leading-relaxed text-muted-foreground">
                  {e.description}
                </p>

                <div className="mt-4 space-y-2 border-t border-ink/10 pt-3.5 text-[12px] text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                    <span className="tnum">
                      {e.date}
                      {e.end_date !== e.date && ` – ${e.end_date}`} · {e.start_time}–{e.end_time}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">
                      {e.venue} · {e.organizer}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-3.5 w-3.5 shrink-0" />
                    <span className="tnum">
                      {e.registered} of {e.capacity} registered
                    </span>
                  </div>
                </div>

                <div className="mt-4">
                  <Meter
                    value={e.registered}
                    max={e.capacity}
                    tone={full ? "amber" : "violet"}
                    caption={`${pct}%`}
                    label="Capacity"
                  />
                </div>

                <div className="mt-5 flex gap-2">
                  <Button
                    className="flex-1"
                    variant={mine ? "outline" : "default"}
                    disabled={closed || toggle.isPending || (!mine && full)}
                    onClick={() => toggle.mutate({ id: e.id, registered: mine })}
                  >
                    {mine ? "Cancel registration" : closed ? "Closed" : full ? "Full" : "Register"}
                  </Button>
                  <Button
                    variant="outline"
                    aria-label={`Discuss ${e.name}`}
                    onClick={() => setDiscussing(discussing === e.id ? null : e.id)}
                  >
                    <MessageSquare />
                  </Button>
                </div>

                {discussing === e.id && (
                  <div className="mt-4">
                    <CommentThread targetType="event" targetId={e.id} title="Event discussion" />
                  </div>
                )}
                </div>
              </article>
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
        extra={
          <ImagePicker
            value={cover}
            onChange={(url, provider) => {
              setCover(url);
              setCoverProvider(provider);
            }}
            provider={uploadConfig?.images ?? "local"}
            label="Event image"
            hint="Paste an Unsplash link, or upload your own poster."
          />
        }
        onSubmit={(v: FormValues) =>
          create.mutate(
            {
              ...v,
              registered: 0,
              registrations: [],
              image_url: cover,
              image_provider: coverProvider,
            } as unknown as Partial<CampusEvent>,
            { onSuccess: () => setCreating(false) }
          )
        }
      />

      <FormDialog
        open={Boolean(editing)}
        onOpenChange={(o) => !o && setEditing(null)}
        title="Edit event"
        fields={FIELDS}
        initial={editing ? (editing as unknown as FormValues) : undefined}
        submitting={update.isPending}
        extra={
          <ImagePicker
            value={cover}
            onChange={(url, provider) => {
              setCover(url);
              setCoverProvider(provider);
            }}
            provider={uploadConfig?.images ?? "local"}
            label="Event image"
            hint="Paste an Unsplash link, or upload your own poster."
          />
        }
        onSubmit={(v: FormValues) =>
          editing &&
          update.mutate(
            {
              id: editing.id,
              payload: {
                ...v,
                image_url: cover,
                image_provider: coverProvider,
              } as unknown as Partial<CampusEvent>,
            },
            { onSuccess: () => setEditing(null) }
          )
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
