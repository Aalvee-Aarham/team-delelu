import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RowActions({
  onEdit,
  onDelete,
  label,
}: {
  onEdit: () => void;
  onDelete: () => void;
  label: string;
}) {
  return (
    <div className="flex items-center justify-end gap-1">
      <Button variant="ghost" size="icon-sm" aria-label={`Edit ${label}`} onClick={onEdit}>
        <Pencil />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={`Delete ${label}`}
        className="hover:bg-destructive/10 hover:text-destructive"
        onClick={onDelete}
      >
        <Trash2 />
      </Button>
    </div>
  );
}
