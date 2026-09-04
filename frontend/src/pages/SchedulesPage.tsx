import { useMemo, useState } from "react";
import { CalendarDays, Plus } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { FormDialog } from "@/components/FormDialog";
import type { FieldDef, FormValues } from "@/components/FormDialog";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { FilterTabs } from "@/components/FilterTabs";
import { DataTable, TCell, TRow } from "@/components/DataTable";
import { RowActions } from "@/components/RowActions";
import { EmptyState } from "@/components/EmptyState";
import { useResourceList, useResourceMutations } from "@/hooks/useResource";
import { useAuth } from "@/context/AuthContext";
import type { Schedule } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  const [day, setDay] = useState("");
  const [editing, setEditing] = useState<Schedule | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Schedule | null>(null);

  const { data, isLoading } = useResourceList<Schedule>("schedules", { day: day || undefined });
  const { create, update, remove } = useResourceMutations<Schedule>("schedules", "Class");

  const rows = useMemo(
    () =>
      [...(data ?? [])].sort(
        (a, b) => DAYS.indexOf(a.day) - DAYS.indexOf(b.day) || a.start_time.localeCompare(b.start_time)
      ),
    [data]
  );

  const columns = [
    { key: "index", label: "#", className: "w-12" },
    { key: "course", label: "Course" },
    { key: "day", label: "Day" },
    { key: "time", label: "Time" },
    { key: "room", label: "Room" },
    { key: "instructor", label: "Instructor" },
    { key: "section", label: "Sec" },
    ...(isAdmin ? [{ key: "actions", label: "Actions", className: "w-24 text-right" }] : []),
  ];

  return (
    <>
      <PageHeader
        eyebrow="Academics"
        title="Class Schedule"
        subtitle="The weekly timetable, Sunday to Thursday. Admins can add, edit and remove classes."
        action={
          isAdmin && (
            <Button onClick={() => setCreating(true)}>
              <Plus />
              Add class
            </Button>
          )
        }
      />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <FilterTabs
          value={day}
          onChange={setDay}
          options={[{ value: "", label: "All days" }, ...DAYS.map((d) => ({ value: d, label: d }))]}
        />
        <span className="eyebrow text-muted-foreground">
          {rows.length} {rows.length === 1 ? "class" : "classes"}
        </span>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No classes found"
          description={
            day
              ? `Nothing is timetabled on ${day}. Try another day.`
              : "The timetable is empty for now."
          }
        />
      ) : (
        <DataTable columns={columns}>
          {rows.map((s, index) => (
            <TRow key={s.id}>
              <TCell className="tnum text-[13px] text-muted-foreground">{index + 1}</TCell>
              <TCell>
                <div className="font-semibold">{s.course}</div>
                <div className="mt-0.5 text-[12px] text-muted-foreground">{s.title}</div>
              </TCell>
              <TCell className="text-[13px]">{s.day}</TCell>
              <TCell className="tnum text-[13px] whitespace-nowrap">
                {s.start_time}–{s.end_time}
              </TCell>
              <TCell>
                <Badge>{s.room}</Badge>
              </TCell>
              <TCell className="text-[13px] text-muted-foreground">{s.instructor}</TCell>
              <TCell className="text-[13px] text-muted-foreground">{s.section}</TCell>
              {isAdmin && (
                <TCell>
                  <RowActions
                    label={s.course}
                    onEdit={() => setEditing(s)}
                    onDelete={() => setDeleting(s)}
                  />
                </TCell>
              )}
            </TRow>
          ))}
        </DataTable>
      )}

      <FormDialog
        open={creating}
        onOpenChange={setCreating}
        title="Add a class"
        description="Adds a slot to the weekly timetable and blocks the room for that period."
        fields={FIELDS}
        submitting={create.isPending}
        onSubmit={(values: FormValues) =>
          create.mutate(values as Partial<Schedule>, { onSuccess: () => setCreating(false) })
        }
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
          update.mutate(
            { id: editing.id, payload: values as Partial<Schedule> },
            { onSuccess: () => setEditing(null) }
          )
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
