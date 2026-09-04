import { useMemo, useState } from "react";
import { GraduationCap, Plus } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { FormDialog } from "@/components/FormDialog";
import type { FieldDef, FormValues } from "@/components/FormDialog";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { FilterTabs } from "@/components/FilterTabs";
import { EmptyState } from "@/components/EmptyState";
import { CourseCard } from "@/components/CourseCard";
import { ImagePicker } from "@/components/ImagePicker";
import { useResourceList, useResourceMutations } from "@/hooks/useResource";
import { useUploadConfig } from "@/hooks/useClassroom";
import { useAuth } from "@/context/AuthContext";
import { daysUntil } from "@/lib/classroom.utils";
import type { Assignment, Course } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const ACCENTS = ["blue", "violet", "green", "amber", "red", "cyan", "ink"];

const FIELDS: FieldDef[] = [
  { name: "id", label: "Course ID", required: true, placeholder: "crs-4150", hideOnEdit: true },
  { name: "code", label: "Course code", required: true, placeholder: "CSE 4150" },
  { name: "title", label: "Course title", required: true },
  { name: "description", label: "Description", type: "textarea" },
  { name: "instructor", label: "Instructor", placeholder: "Prof. Dr. …" },
  { name: "section", label: "Section", placeholder: "B" },
  { name: "room", label: "Room", placeholder: "7A07" },
  { name: "term", label: "Term", placeholder: "Fall 2026" },
  { name: "accent", label: "Accent colour", type: "select", options: ACCENTS },
];

import { isCourseInStudentSemester } from "@/lib/course.utils";

export default function CoursesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const { data: uploadConfig } = useUploadConfig();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  const [deleting, setDeleting] = useState<Course | null>(null);
  const [cover, setCover] = useState("");

  const { data, isLoading } = useResourceList<Course>("courses");
  const { data: assignments } = useResourceList<Assignment>("assignments");
  const { create, update, remove } = useResourceMutations<Course>("courses", "Course");

  const byCourse = useMemo(() => {
    const map = new Map<string, Assignment[]>();
    for (const a of assignments ?? []) {
      const list = map.get(a.course_id) ?? [];
      list.push(a);
      map.set(a.course_id, list);
    }
    return map;
  }, [assignments]);

  const semesterCount = useMemo(
    () => (data ?? []).filter((c) => isCourseInStudentSemester(c.code, user)).length,
    [data, user]
  );
  const enrolledCount = useMemo(
    () => (data ?? []).filter((c) => c.enrolled.includes(user?.student_id ?? "")).length,
    [data, user?.student_id]
  );

  const [scope, setScope] = useState<string>("semester");

  const rows = useMemo(() => {
    let list = [...(data ?? [])];
    if (!isAdmin) {
      if (scope === "semester") {
        list = list.filter((c) => isCourseInStudentSemester(c.code, user));
      } else if (scope === "enrolled") {
        list = list.filter((c) => c.enrolled.includes(user?.student_id ?? ""));
      }
    }
    return list.sort((a, b) => a.code.localeCompare(b.code));
  }, [data, isAdmin, scope, user]);

  const openCreate = () => {
    setCover("");
    setCreating(true);
  };

  const openEdit = (course: Course) => {
    setCover(course.cover_url);
    setEditing(course);
  };

  return (
    <>
      <PageHeader
        eyebrow="Academics"
        title="Courses"
        subtitle={
          isAdmin
            ? "Every course offered on campus. Open one for its stream, classwork and submissions."
            : `Curriculum and enrollment for ${user?.department ?? "CSE"} Year ${user?.year ?? 4}, Semester ${user?.semester ?? 1}.`
        }
        action={
          isAdmin && (
            <Button onClick={openCreate}>
              <Plus />
              Create course
            </Button>
          )
        }
      />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <FilterTabs
          value={scope}
          onChange={setScope}
          options={[
            ...(!isAdmin
              ? [
                  {
                    value: "semester",
                    label: `Year ${user?.year ?? 4} Sem ${user?.semester ?? 1}`,
                    count: semesterCount,
                  },
                  { value: "enrolled", label: "My enrolled", count: enrolledCount },
                ]
              : []),
            { value: "all", label: "All courses", count: (data ?? []).length },
          ]}
        />
        <span className="eyebrow text-muted-foreground">
          {rows.length} {rows.length === 1 ? "course" : "courses"}
        </span>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No courses yet"
          description={isAdmin ? "Create the first course to start posting classwork." : "Nothing has been published yet."}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((course) => {
            const list = byCourse.get(course.id) ?? [];
            return (
              <CourseCard
                key={course.id}
                course={course}
                assignmentCount={list.length}
                dueCount={list.filter((a) => daysUntil(a.deadline) >= 0).length}
                joined={course.enrolled.includes(user?.student_id ?? "")}
                isAdmin={isAdmin}
                onEdit={() => openEdit(course)}
                onDelete={() => setDeleting(course)}
              />
            );
          })}
        </div>
      )}

      <FormDialog
        open={creating}
        onOpenChange={setCreating}
        title="Create a course"
        description="Courses group classwork, notices and submissions, the way a Google Classroom class does."
        fields={FIELDS}
        submitting={create.isPending}
        extra={
          <ImagePicker
            value={cover}
            onChange={setCover}
            provider={uploadConfig?.images ?? "local"}
          />
        }
        onSubmit={(v: FormValues) =>
          create.mutate({ ...v, cover_url: cover } as unknown as Partial<Course>, {
            onSuccess: () => setCreating(false),
          })
        }
      />

      <FormDialog
        open={Boolean(editing)}
        onOpenChange={(o) => !o && setEditing(null)}
        title="Edit course"
        fields={FIELDS}
        initial={editing ? (editing as unknown as FormValues) : undefined}
        submitting={update.isPending}
        extra={
          <ImagePicker
            value={cover}
            onChange={setCover}
            provider={uploadConfig?.images ?? "local"}
          />
        }
        onSubmit={(v: FormValues) =>
          editing &&
          update.mutate(
            { id: editing.id, payload: { ...v, cover_url: cover } as unknown as Partial<Course> },
            { onSuccess: () => setEditing(null) }
          )
        }
      />

      <ConfirmDelete
        open={Boolean(deleting)}
        onOpenChange={(o) => !o && setDeleting(null)}
        label={deleting?.title ?? ""}
        pending={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.id, { onSuccess: () => setDeleting(null) })}
      />
    </>
  );
}
