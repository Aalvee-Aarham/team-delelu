import { TriangleAlert } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ConfirmDeleteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  label: string;
  onConfirm: () => void;
  pending?: boolean;
}

export function ConfirmDelete({ open, onOpenChange, label, onConfirm, pending }: ConfirmDeleteProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <span className="mb-1 grid h-9 w-9 place-items-center rounded-md border border-destructive/30 bg-destructive/10 text-destructive">
            <TriangleAlert className="h-4 w-4" />
          </span>
          <DialogTitle>Delete this record?</DialogTitle>
          <DialogDescription>
            <span className="font-medium text-foreground">{label}</span> will be permanently removed
            and every open tab will see it disappear. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={pending}>
            {pending ? "Deleting…" : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
