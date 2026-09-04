import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { FormDialog } from "@/components/FormDialog";
import type { FieldDef, FormValues } from "@/components/FormDialog";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { RoomFinder } from "@/components/RoomFinder";
import type { RoomFilters } from "@/components/RoomFinder";
import { useResourceList, useResourceMutations } from "@/hooks/useResource";
import { useAuth } from "@/context/AuthContext";
import { api, apiErrorMessage } from "@/lib/axios";
import type { Room } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const FIELDS: FieldDef[] = [
  { name: "id", label: "ID", required: true, placeholder: "room-021", hideOnEdit: true },
  { name: "room_number", label: "Room number", required: true, placeholder: "7A08" },
  { name: "type", label: "Type", type: "select", options: ["classroom", "lab", "seminar"], required: true },
  { name: "capacity", label: "Capacity", type: "number", required: true },
  { name: "equipment", label: "Equipment (comma separated)", placeholder: "projector, AC, whiteboard" },
  { name: "floor", label: "Floor", type: "number", required: true },
  { name: "status", label: "Status", type: "select", options: ["available", "unavailable"], required: true },
];

const EMPTY_BOOKING = { date: "", start_time: "", end_time: "", purpose: "" };

export default function RoomsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState<RoomFilters>({ type: "", minCapacity: "", equipment: "" });
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Room | null>(null);
  const [deleting, setDeleting] = useState<Room | null>(null);
  const [booking, setBooking] = useState<Room | null>(null);
  const [bookForm, setBookForm] = useState(EMPTY_BOOKING);

  const { data, isLoading } = useResourceList<Room>("rooms", {
    type: filters.type || undefined,
    min_capacity: filters.minCapacity || undefined,
    equipment: filters.equipment || undefined,
  });
  const { create, update, remove } = useResourceMutations<Room>("rooms", "Room");

  const book = useMutation({
    mutationFn: async ({ room, payload }: { room: string; payload: typeof bookForm }) =>
      (await api.post(`/rooms/${room}/book`, payload)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      toast.success("Room booked");
      setBooking(null);
      setBookForm(EMPTY_BOOKING);
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

  return (
    <>
      <PageHeader
        title="Rooms"
        subtitle="Capacity, equipment and live bookings. A timetabled class blocks a room too."
        action={
          isAdmin && (
            <Button onClick={() => setCreating(true)} className="gap-2">
              <Plus className="h-4 w-4" /> Add room
            </Button>
          )
        }
      />

      <RoomFinder filters={filters} onFiltersChange={setFilters} />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(data ?? []).map((room) => (
            <div key={room.id} className="flex flex-col rounded-xl border border-border bg-card p-4">
              <div className="mb-2 flex items-start justify-between">
                <div>
                  <div className="text-lg font-semibold">{room.room_number}</div>
                  <div className="text-xs capitalize text-muted-foreground">
                    {room.type} · floor {room.floor} · {room.capacity} seats
                  </div>
                </div>
                {isAdmin && (
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setEditing(room)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleting(room)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="mb-3 flex flex-wrap gap-1">
                {room.equipment.map((eq) => (
                  <span key={eq} className="rounded bg-secondary px-1.5 py-0.5 text-[11px] text-muted-foreground">
                    {eq}
                  </span>
                ))}
              </div>

              <div className="flex-1">
                {room.bookings.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Bookings</div>
                    {room.bookings.map((b) => (
                      <div
                        key={b.booking_id}
                        className="flex items-center justify-between gap-2 rounded bg-secondary/60 px-2 py-1 text-xs"
                      >
                        <span className="min-w-0 truncate">
                          {b.date} {b.start_time}–{b.end_time} · {b.purpose}
                        </span>
                        <button
                          className="shrink-0 text-muted-foreground hover:text-destructive"
                          onClick={() => cancelBooking.mutate(b.booking_id)}
                          title="Cancel booking"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button
                className="mt-3 w-full"
                variant="outline"
                size="sm"
                disabled={room.status === "unavailable"}
                onClick={() => setBooking(room)}
              >
                {room.status === "unavailable" ? "Unavailable" : "Book this room"}
              </Button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={Boolean(booking)} onOpenChange={(o) => !o && setBooking(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Book {booking?.room_number}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5">
              <Label>Date</Label>
              <Input type="date" value={bookForm.date} onChange={(e) => setBookForm({ ...bookForm, date: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>From</Label>
                <Input
                  placeholder="15:00"
                  value={bookForm.start_time}
                  onChange={(e) => setBookForm({ ...bookForm, start_time: e.target.value })}
                />
              </div>
              <div className="grid gap-1.5">
                <Label>To</Label>
                <Input
                  placeholder="17:00"
                  value={bookForm.end_time}
                  onChange={(e) => setBookForm({ ...bookForm, end_time: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label>Purpose</Label>
              <Input value={bookForm.purpose} onChange={(e) => setBookForm({ ...bookForm, purpose: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBooking(null)}>
              Cancel
            </Button>
            <Button
              disabled={book.isPending || !bookForm.date || !bookForm.start_time || !bookForm.end_time || !bookForm.purpose}
              onClick={() => booking && book.mutate({ room: booking.room_number, payload: bookForm })}
            >
              {book.isPending ? "Booking…" : "Confirm booking"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <FormDialog
        open={creating}
        onOpenChange={setCreating}
        title="Add a room"
        fields={FIELDS}
        submitting={create.isPending}
        onSubmit={(v: FormValues) => create.mutate(v as Partial<Room>, { onSuccess: () => setCreating(false) })}
      />

      <FormDialog
        open={Boolean(editing)}
        onOpenChange={(o) => !o && setEditing(null)}
        title={`Edit ${editing?.room_number ?? ""}`}
        fields={FIELDS}
        initial={editing ? (editing as unknown as FormValues) : undefined}
        submitting={update.isPending}
        onSubmit={(v: FormValues) =>
          editing && update.mutate({ id: editing.id, payload: v as Partial<Room> }, { onSuccess: () => setEditing(null) })
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
