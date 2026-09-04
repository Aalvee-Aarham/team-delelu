import { useEffect, useState } from "react";
import type { Room } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface BookingForm {
  date: string;
  start_time: string;
  end_time: string;
  purpose: string;
}

const EMPTY: BookingForm = { date: "", start_time: "", end_time: "", purpose: "" };

export function BookRoomDialog({
  room,
  onOpenChange,
  onConfirm,
  pending,
}: {
  room: Room | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (payload: BookingForm) => void;
  pending: boolean;
}) {
  const [form, setForm] = useState<BookingForm>(EMPTY);

  useEffect(() => {
    if (room) setForm(EMPTY);
  }, [room]);

  const complete = form.date && form.start_time && form.end_time && form.purpose;

  return (
    <Dialog open={Boolean(room)} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Book {room?.room_number}</DialogTitle>
          <DialogDescription>
            The slot is checked against existing bookings and timetabled classes before it is saved.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="booking-date">Date</Label>
            <Input
              id="booking-date"
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="booking-from">From</Label>
              <Input
                id="booking-from"
                placeholder="15:00"
                value={form.start_time}
                onChange={(e) => setForm({ ...form, start_time: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="booking-to">To</Label>
              <Input
                id="booking-to"
                placeholder="17:00"
                value={form.end_time}
                onChange={(e) => setForm({ ...form, end_time: e.target.value })}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="booking-purpose">Purpose</Label>
            <Input
              id="booking-purpose"
              placeholder="Project meeting"
              value={form.purpose}
              onChange={(e) => setForm({ ...form, purpose: e.target.value })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={pending || !complete} onClick={() => onConfirm(form)}>
            {pending ? "Booking…" : "Confirm booking"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
