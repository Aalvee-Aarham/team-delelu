import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { NotebookPen, Plus, Send } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { FormDialog } from "@/components/FormDialog";
import type { FieldDef, FormValues } from "@/components/FormDialog";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { FilterTabs } from "@/components/FilterTabs";
import { RowActions } from "@/components/RowActions";
import { EmptyState } from "@/components/EmptyState";
import { StatusPill } from "@/components/StatusPill";
import { useResourceList, useResourceMutations } from "@/hooks/useResource";
import { useSubmissions } from "@/hooks/useClassroom";
import { useAuth } from "@/context/AuthContext";
import type { Assignment, Course, Submission } from "@/lib/types";
import { TONE_EDGE } from "@/lib/tone";
import { SUBMISSION_LABEL, SUBMISSION_TONE, daysUntil } from "@/lib/classroom.utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { isCourseInStudentSemester } from "@/lib/course.utils";

const STATUSES = ["pending", "submitted", "graded", "late"];

const FIELDS: FieldDef[] = [
  { name: "id", label: "ID", required: true, placeholder: "asgn-009", hideOnEdit: true },
  { name: "course_id", label: "Course", type: "select", options: [], required: true },
  { name: "course", label: "Course code", required: true, placeholder: "CSE 4113" },
  { name: "course_title", label: "Course title", required: true },
  { name: "title", label: "Assignment title", required: true },
  { name: "description", label: "Description", type: "textarea", required: true },
  { name: "assigned_date", label: "Assigned date", type: "date", required: true },
  { name: "deadline", label: "Deadline", type: "date", required: true },
  { name: "submission_platform", label: "Submission platform", required: true },
  { name: "status", label: "Status", type: "select", options: STATUSES, required: true },
  { name: "marks", label: "Marks", type: "number", required: true },
];

export default function AssignmentsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [status, setStatus] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Assignment | null>(null);
  const [deleting, setDeleting] = useState<Assignment | null>(null);

  const [scope, setScope] = useState<string>("my");

  const { data, isLoading } = useResourceList<Assignment>("assignments");
  const { data: courses } = useResourceList<Course>("courses");
  const { data: submissions } = useSubmissions();
  const { create, update, remove } = useResourceMutations<Assignment>("assignments", "Assignment");

  const myEnrolledCourses = useMemo(
    () => (courses ?? []).filter((c) => c.enrolled.includes(user?.student_id ?? "")),
    [courses, user?.student_id]
  );
  const myCourseIds = useMemo(() => new Set(myEnrolledCourses.map((c) => c.id)), [myEnrolledCourses]);
  const myCourseCodes = useMemo(() => new Set(myEnrolledCourses.map((c) => c.code)), [myEnrolledCourses]);
  const hasEnrolled = myEnrolledCourses.length > 0;
  const activeScope = !isAdmin && hasEnrolled && scope === "my" ? "my" : scope === "my" && !hasEnrolled ? "all" : scope;

  const fields = useMemo(
    () =>
      FIELDS.map((f) =>
        f.name === "course_id"
          ? { ...f, options: (courses ?? []).map((c) => c.id) }
          : f
      ),
    [courses]
  );

  const courseName = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of courses ?? []) map.set(c.id, `${c.code} — ${c.title}`);
    return map;
  }, [courses]);

  const mySubmission = useMemo(() => {
    const map = new Map<string, Submission>();
    for (const s of submissions ?? []) {
      if (isAdmin || s.student_id === user?.student_id) map.set(s.assignment_id, s);
    }
    return map;
  }, [submissions, isAdmin, user?.student_id]);

  const submissionCount = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of submissions ?? []) map.set(s.assignment_id, (map.get(s.assignment_id) ?? 0) + 1);
    return map;
  }, [submissions]);

  // Filter assignments by scope (my enrolled courses vs all) and status
  const filteredAssignments = useMemo(() => {
    let list = [...(data ?? [])];

    // 1. Course scope
    if (!isAdmin && activeScope === "my") {
      list = list.filter((a) => {
        if (hasEnrolled) {
          return myCourseIds.has(a.course_id) || myCourseCodes.has(a.course);
        }
        return isCourseInStudentSemester(a.course, user);
      });
    }

    // 2. Status filter
    if (status) {
      list = list.filter((a) => {
        const mine = mySubmission.get(a.id);
        if (status === "submitted") return mine && (mine.status === "submitted" || mine.status === "accepted");
        if (status === "graded") return mine && mine.status === "accepted";
        if (status === "returned") return mine && mine.status === "returned";
        if (status === "overdue") return !mine && daysUntil(a.deadline) < 0;
        if (status === "pending") return !mine && daysUntil(a.deadline) >= 0;
        return true;
      });
    }

    return list;
  }, [data, isAdmin, activeScope, status, myCourseIds, myCourseCodes, mySubmission]);

  const grouped = useMemo(() => {
    const map = new Map<string, Assignment[]>();
    for (const a of [...filteredAssignments].sort((x, y) => x.deadline.localeCompare(y.deadline))) {
      const key = a.course_id || a.course;
      const list = map.get(key) ?? [];
      list.push(a);
      map.set(key, list);
    }
    return [...map.entries()].sort((a, b) => {
      const soonestA = a[1][0]?.deadline ?? "";
      const soonestB = b[1][0]?.deadline ?? "";
      return soonestA.localeCompare(soonestB);
    });
  }, [filteredAssignments]);

  const total = filteredAssignments.length;

  return (
    <>
      <PageHeader
        eyebrow="Academics"
        title="Assignments"
        subtitle={
          isAdmin
            ? "Manage all coursework across courses and track student submissions."
            : `Coursework for student ${user?.student_id ?? ""}. Hand in work and track deadlines.`
        }
        action={
          isAdmin && (
            <Button onClick={() => setCreating(true)}>
              <Plus />
              Add assignment
            </Button>
          )
        }
      />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {!isAdmin && hasEnrolled && (
            <FilterTabs
              value={activeScope}
              onChange={setScope}
              options={[
                { value: "my", label: "My courses" },
                { value: "all", label: "All courses" },
              ]}
            />
          )}
          <FilterTabs
            value={status}
            onChange={setStatus}
            options={[
              { value: "", label: "All" },
              { value: "pending", label: "Due" },
              { value: "submitted", label: "Submitted" },
              { value: "graded", label: "Graded" },
              { value: "overdue", label: "Overdue" },
            ]}
          />
        </div>
        <span className="eyebrow text-muted-foreground">
          {total} {total === 1 ? "assignment" : "assignments"} in {grouped.length}{" "}
          {grouped.length === 1 ? "course" : "courses"}
        </span>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : grouped.length === 0 ? (
        <EmptyState
          icon={NotebookPen}
          title="No assignments"
          description="Nothing matches this filter right now."
        />
      ) : (
        <div className="space-y-8">
          {grouped.map(([key, list]) => (
            <section key={key}>
              <div className="mb-3 flex flex-wrap items-center gap-3">
                {courseName.has(key) ? (
                  <Link
                    to={`/courses/${key}`}
                    className="text-[15px] font-semibold tracking-tight hover:underline"
                  >
                    {courseName.get(key)}
                  </Link>
                ) : (
                  <h2 className="text-[15px] font-semibold tracking-tight">{list[0].course}</h2>
                )}
                <div className="rule-dotted h-px min-w-8 flex-1" />
                <span className="tnum text-[11px] text-muted-foreground">
                  {list.length} {list.length === 1 ? "item" : "items"}
                </span>
              </div>

              <div className="space-y-3">
                {list.map((a) => {
                  const mine = mySubmission.get(a.id);
                  const left = daysUntil(a.deadline);
                  const overdue = left < 0 && !mine;
                  const tone = mine ? SUBMISSION_TONE[mine.status] : overdue ? "red" : "amber";
                  return (
                    <article
                      key={a.id}
                      className={`rounded-lg border border-ink/12 border-l-[3px] bg-card p-5 ${TONE_EDGE[tone]}`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="mb-2.5 flex flex-wrap items-center gap-2">
                            <Badge>{a.course}</Badge>
                            {mine ? (
                              <StatusPill tone={SUBMISSION_TONE[mine.status]}>
                                {SUBMISSION_LABEL[mine.status]}
                              </StatusPill>
                            ) : (
                              <StatusPill tone={overdue ? "red" : "amber"}>
                                {isAdmin ? "Open" : "Not turned in"}
                              </StatusPill>
                            )}
                            <span className="tnum text-[11px] text-muted-foreground">
                              {a.marks} marks
                            </span>
                            {isAdmin && (
                              <span className="tnum text-[11px] text-muted-foreground">
                                · {submissionCount.get(a.id) ?? 0} submitted
                              </span>
                            )}
                          </div>

                          <Link
                            to={`/assignments/${a.id}`}
                            className="text-[15px] font-semibold tracking-tight hover:underline"
                          >
                            {a.title}
                          </Link>
                          <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
                            {a.description}
                          </p>

                          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                            <Send className="h-3 w-3" />
                            Submit via {a.submission_platform}
                          </div>
                        </div>

                        <div className="flex shrink-0 items-start gap-3">
                          <div className="rounded-md border border-ink/12 bg-paper-deep/50 px-3 py-2 text-right">
                            <div className="eyebrow text-muted-foreground">Deadline</div>
                            <div className="tnum mt-1.5 text-[13px] font-semibold">{a.deadline}</div>
                            <div
                              className={`tnum mt-0.5 text-[11px] font-medium ${
                                overdue
                                  ? "text-[#b91c1c]"
                                  : left <= 3 && !mine
                                    ? "text-[#8a6608]"
                                    : "text-muted-foreground"
                              }`}
                            >
                              {overdue
                                ? `${Math.abs(left)}d overdue`
                                : left === 0
                                  ? "due today"
                                  : `${left}d left`}
                            </div>
                          </div>

                          {isAdmin && (
                            <RowActions
                              label={a.title}
                              onEdit={() => setEditing(a)}
                              onDelete={() => setDeleting(a)}
                            />
                          )}
                        </div>
                      </div>

                      <div className="mt-4 border-t border-ink/10 pt-3">
                        <Link
                          to={`/assignments/${a.id}`}
                          className="text-[12px] font-medium text-primary hover:underline"
                        >
                          {isAdmin ? "Review submissions →" : mine ? "View or resubmit →" : "Open and hand in →"}
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      <FormDialog
        open={creating}
        onOpenChange={setCreating}
        title="Add an assignment"
        description="Pick the course it belongs to so it lands in the right classroom stream."
        fields={fields}
        submitting={create.isPending}
        onSubmit={(v: FormValues) =>
          create.mutate(v as Partial<Assignment>, { onSuccess: () => setCreating(false) })
        }
      />

      <FormDialog
        open={Boolean(editing)}
        onOpenChange={(o) => !o && setEditing(null)}
        title="Edit assignment"
        fields={fields}
        initial={editing ? (editing as unknown as FormValues) : undefined}
        submitting={update.isPending}
        onSubmit={(v: FormValues) =>
          editing &&
          update.mutate(
            { id: editing.id, payload: v as Partial<Assignment> },
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
