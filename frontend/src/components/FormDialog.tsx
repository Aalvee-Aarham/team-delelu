import { useEffect, useState } from "react";
import type { ReactNode } from "react";
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
import { Textarea } from "@/components/ui/textarea";

export interface FieldDef {
  name: string;
  label: string;
  type?: "text" | "number" | "textarea" | "select" | "date" | "time";
  options?: string[];
  required?: boolean;
  placeholder?: string;
  hideOnEdit?: boolean;
}

export type FormValues = Record<string, string | number | string[]>;

interface FormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  fields: FieldDef[];
  initial?: FormValues;
  submitting?: boolean;
  extra?: ReactNode;
  onSubmit: (values: FormValues) => void;
}

export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  fields,
  initial,
  submitting,
  extra,
  onSubmit,
}: FormDialogProps) {
  const [values, setValues] = useState<FormValues>({});
  const isEdit = Boolean(initial);

  useEffect(() => {
    if (open) setValues(initial ?? {});
  }, [open, initial]);

  const visible = fields.filter((f) => !(isEdit && f.hideOnEdit));

  const submit = () => {
    const payload: FormValues = {};
    for (const field of visible) {
      const raw = values[field.name];
      if (raw === undefined || raw === "") continue;
      if (field.type === "number") {
        payload[field.name] = Number(raw);
      } else if (field.name === "equipment") {
        payload[field.name] = String(raw)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      } else {
        payload[field.name] = raw;
      }
    }
    onSubmit(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[86vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <div className="grid gap-4">
          {visible.map((field) => {
            const value = values[field.name];
            const stringValue = Array.isArray(value) ? value.join(", ") : value === undefined ? "" : String(value);
            return (
              <div key={field.name} className="grid gap-2">
                <Label htmlFor={field.name}>
                  {field.label}
                  {field.required && <span className="ml-1 text-destructive">*</span>}
                </Label>

                {field.type === "textarea" ? (
                  <Textarea
                    id={field.name}
                    rows={4}
                    value={stringValue}
                    placeholder={field.placeholder}
                    onChange={(e) => setValues((v) => ({ ...v, [field.name]: e.target.value }))}
                  />
                ) : field.type === "select" ? (
                  <select
                    id={field.name}
                    value={stringValue}
                    onChange={(e) => setValues((v) => ({ ...v, [field.name]: e.target.value }))}
                    className="h-9 rounded-md border border-input bg-card px-3 text-sm capitalize outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25"
                  >
                    <option value="">Select…</option>
                    {field.options?.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    id={field.name}
                    type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
                    value={stringValue}
                    placeholder={field.placeholder}
                    onChange={(e) => setValues((v) => ({ ...v, [field.name]: e.target.value }))}
                  />
                )}
              </div>
            );
          })}
          {extra}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={submitting}>
            {submitting ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
