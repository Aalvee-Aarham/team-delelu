import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { DoorOpen, Layers, Plus, Users, X } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { FormDialog } from "@/components/FormDialog";
import type { FieldDef, FormValues } from "@/components/FormDialog";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { RoomFinder } from "@/components/RoomFinder";
import type { RoomFilters } from "@/components/RoomFinder";
import { BookRoomDialog } from "@/components/BookRoomDialog";
import type { BookingForm } from "@/components/BookRoomDialog";
import { RowActions } from "@/components/RowActions";
import { EmptyState } from "@/components/EmptyState";
import { StatusPill } from "@/components/StatusPill";
import { useResourceList, useResourceMutations } from "@/hooks/useResource";
import { useAuth } from "@/context/AuthContext";
import { api, apiErrorMessage } from "@/lib/axios";
import type { Room } from "@/lib/types";
import { ROOM_TONE } from "@/lib/tone";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const FIELDS: FieldDef[] = [
  { name: "id", label: "ID", required: true, placeholder: "room-021", hideOnEdit: true },
  { name: "room_number", label: "Room number", required: true, placeholder: "7A08" },
  { name: "type", label: "Type", type: "select", options: ["classroom", "lab", "seminar"], required: true },
  { name: "capacity", label: "Capacity", type: "number", required: true },
  { name: "equipment", label: "Equipment (comma separated)", placeholder: "projector, AC, whiteboard" },
  { name: "floor", label: "Floor", type: "number", required: true },
  { name: "status", label: "Status", type: "select", options: ["available", "unavailable"], required: true },
];

export default function RoomsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState<RoomFilters>({ type: "", minCapacity: "", equipment: "" });
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Room | null>(null);
  const [deleting, setDeleting] = useState<Room | null>(null);
  const [booking, setBooking] = useState<Room | null>(null);

  const { data, isLoading } = useResourceList<Room>("rooms", {
    type: filters.type || undefined,
    min_capacity: filters.minCapacity || undefined,
    equipment: filters.equipment || undefined,
  });
  const { create, update, remove } = useResourceMutations<Room>("rooms", "Room");

  const book = useMutation({
    mutationFn: async ({ room, payload }: { room: string; payload: BookingForm }) =>
      (await api.post(`/rooms/${room}/book`, payload)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      toast.success("Room booked");
      setBooking(null);
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  const cancelBooking = useMutation({
    mutationFn: async (bookingId: string) => (await api.delete(`/bookings/${bookingId}`)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      toast.success("Booking cancelled");
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  const rows = data ?? [];

  return (
    <>
      <PageHeader
        eyebrow="Campus"
        title="Rooms"
        subtitle="Capacity, equipment and live bookings across the building."
        action={
          isAdmin && (
            <Button onClick={() => setCreating(true)}>
              <Plus />
              Add room
            </Button>
          )
        }
      />

      <RoomFinder filters={filters} onFiltersChange={setFilters} />

      <div className="eyebrow mb-4 text-muted-foreground">
        {rows.length} {rows.length === 1 ? "room" : "rooms"}
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-52 w-full" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={DoorOpen}
          title="No rooms match"
          description="Loosen the capacity or equipment filters to see more rooms."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((room) => {
            const unavailable = room.status === "unavailable";
            return (
              <article
                key={room.id}
                className="flex flex-col rounded-lg border border-ink/12 bg-card p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xl leading-none font-bold tracking-tight">
                      {room.room_number}
                    </div>
                    <div className="mt-2.5 flex flex-wrap items-center gap-2">
                      <StatusPill tone={ROOM_TONE[room.type] ?? "ink"}>{room.type}</StatusPill>
                      {unavailable && <StatusPill tone="red">unavailable</StatusPill>}
                    </div>
                  </div>
                  {isAdmin && (
                    <RowActions
                      label={room.room_number}
                      onEdit={() => setEditing(room)}
                      onDelete={() => setDeleting(room)}
                    />
                  )}
                </div>

                <div className="mt-4 flex items-center gap-4 text-[12px] text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5" />
                    Floor {room.floor}
                  </span>
                  <span className="tnum flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" />
                    {room.capacity} seats
                  </span>
                </div>

                {room.equipment.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {room.equipment.map((eq) => (
                      <Badge key={eq} variant="secondary">
                        {eq}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="mt-4 flex-1">
                  {room.bookings.length > 0 && (
                    <>
                      <div className="eyebrow mb-2 text-muted-foreground">Bookings</div>
                      <ul className="space-y-1.5">
                        {room.bookings.map((b) => (
                          <li
                            key={b.booking_id}
                            className="flex items-center justify-between gap-2 rounded border border-ink/10 bg-paper-deep/60 px-2 py-1.5 text-[11px]"
                          >
                            <span className="tnum min-w-0 truncate">
                              {b.date} {b.start_time}–{b.end_time} · {b.purpose}
                            </span>
                            <button
                              type="button"
                              aria-label="Cancel booking"
                              className="shrink-0 text-muted-foreground transition-colors hover:text-destructive"
                              onClick={() => cancelBooking.mutate(b.booking_id)}
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>

                <Button
                  className="mt-5 w-full"
                  variant="outline"
                  disabled={unavailable}
                  onClick={() => setBooking(room)}
                >
                  {unavailable ? "Unavailable" : "Book this room"}
                </Button>
              </article>
            );
          })}
        </div>
      )}

      <BookRoomDialog
        room={booking}
        pending={book.isPending}
        onOpenChange={(open) => !open && setBooking(null)}
        onConfirm={(payload) =>
          booking && book.mutate({ room: booking.room_number, payload })
        }
      />

      <FormDialog
        open={creating}
        onOpenChange={setCreating}
        title="Add a room"
        fields={FIELDS}
        submitting={create.isPending}
        onSubmit={(v: FormValues) =>
          create.mutate(v as Partial<Room>, { onSuccess: () => setCreating(false) })
        }
      />

      <FormDialog
        open={Boolean(editing)}
        onOpenChange={(o) => !o && setEditing(null)}
        title={`Edit ${editing?.room_number ?? ""}`}
        fields={FIELDS}
        initial={editing ? (editing as unknown as FormValues) : undefined}
        submitting={update.isPending}
        onSubmit={(v: FormValues) =>
          editing &&
          update.mutate({ id: editing.id, payload: v as Partial<Room> }, { onSuccess: () => setEditing(null) })
        }
      />

      <ConfirmDelete
        open={Boolean(deleting)}
        onOpenChange={(o) => !o && setDeleting(null)}
        label={`Room ${deleting?.room_number}`}
        pending={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.id, { onSuccess: () => setDeleting(null) })}
      />
    </>
  );
}
