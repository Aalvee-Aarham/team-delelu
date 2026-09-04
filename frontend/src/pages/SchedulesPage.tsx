import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { FormDialog } from "@/components/FormDialog";
import type { FieldDef, FormValues } from "@/components/FormDialog";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { useResourceList, useResourceMutations } from "@/hooks/useResource";
import { useAuth } from "@/context/AuthContext";
import type { Schedule } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"];

const FIELDS: FieldDef[] = [
  { name: "id", label: "ID", required: true, placeholder: "sch-025", hideOnEdit: true },
  { name: "course", label: "Course code", required: true, placeholder: "CSE 4113" },
  { name: "title", label: "Course title", required: true },
  { name: "day", label: "Day", type: "select", options: DAYS, required: true },
  { name: "start_time", label: "Start time (HH:MM)", required: true, placeholder: "13:00" },
  { name: "end_time", label: "End time (HH:MM)", required: true, placeholder: "13:50" },
  { name: "room", label: "Room", required: true, placeholder: "7A07" },
  { name: "instructor", label: "Instructor", required: true },
  { name: "section", label: "Section", required: true, placeholder: "B" },
];

export default function SchedulesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [day, setDay] = useState<string>("");
  const [editing, setEditing] = useState<Schedule | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Schedule | null>(null);

  const { data, isLoading } = useResourceList<Schedule>("schedules", { day: day || undefined });
  const { create, update, remove } = useResourceMutations<Schedule>("schedules", "Class");

  const rows = useMemo(
    () => [...(data ?? [])].sort((a, b) => DAYS.indexOf(a.day) - DAYS.indexOf(b.day) || a.start_time.localeCompare(b.start_time)),
    [data]
  );

  return (
    <>
      <PageHeader
        title="Class Schedule"
        subtitle="The weekly timetable. Sunday to Thursday."
        action={
          isAdmin && (
            <Button onClick={() => setCreating(true)} className="gap-2">
              <Plus className="h-4 w-4" /> Add class
            </Button>
          )
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <Button variant={day === "" ? "default" : "outline"} size="sm" onClick={() => setDay("")}>
          All days
        </Button>
        {DAYS.map((d) => (
          <Button key={d} variant={day === d ? "default" : "outline"} size="sm" onClick={() => setDay(d)}>
            {d}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No classes found{day && ` on ${day}`}.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-card text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Course</th>
                <th className="px-4 py-3">Day</th>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Room</th>
                <th className="px-4 py-3">Instructor</th>
                <th className="px-4 py-3">Sec</th>
                {isAdmin && <th className="w-24 px-4 py-3" />}
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id} className="border-t border-border hover:bg-card/60">
                  <td className="px-4 py-3">
                    <div className="font-medium">{s.course}</div>
                    <div className="text-xs text-muted-foreground">{s.title}</div>
                  </td>
                  <td className="px-4 py-3">{s.day}</td>
                  <td className="px-4 py-3 tabular-nums">
                    {s.start_time}–{s.end_time}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary">{s.room}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{s.instructor}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.section}</td>
                  {isAdmin && (
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setEditing(s)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleting(s)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <FormDialog
        open={creating}
        onOpenChange={setCreating}
        title="Add a class"
        fields={FIELDS}
        submitting={create.isPending}
        onSubmit={(values: FormValues) => create.mutate(values as Partial<Schedule>, { onSuccess: () => setCreating(false) })}
      />

      <FormDialog
        open={Boolean(editing)}
        onOpenChange={(o) => !o && setEditing(null)}
        title={`Edit ${editing?.course ?? ""}`}
        fields={FIELDS}
        initial={editing ? (editing as unknown as FormValues) : undefined}
        submitting={update.isPending}
        onSubmit={(values: FormValues) =>
          editing &&
          update.mutate({ id: editing.id, payload: values as Partial<Schedule> }, { onSuccess: () => setEditing(null) })
        }
      />

      <ConfirmDelete
        open={Boolean(deleting)}
        onOpenChange={(o) => !o && setDeleting(null)}
        label={`${deleting?.course} (${deleting?.day} ${deleting?.start_time})`}
        pending={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.id, { onSuccess: () => setDeleting(null) })}
      />
    </>
  );
}
