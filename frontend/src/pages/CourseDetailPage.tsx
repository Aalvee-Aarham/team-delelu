import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, ClipboardCheck, NotebookPen, Users } from "lucide-react";
import { FilterTabs } from "@/components/FilterTabs";
import { EmptyState } from "@/components/EmptyState";
import { StatusPill } from "@/components/StatusPill";
import { CourseBanner } from "@/components/CourseBanner";
import { CourseStreamTab } from "@/components/CourseStreamTab";
import { SubmissionReviewCard } from "@/components/SubmissionReviewCard";
import { useCourseStream } from "@/hooks/useClassroom";
import { useAuth } from "@/context/AuthContext";
import { api, apiErrorMessage } from "@/lib/axios";
import { SUBMISSION_LABEL, SUBMISSION_TONE, deadlineLabel, initials } from "@/lib/classroom.utils";
import type { Submission } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function CourseDetailPage() {
  const { courseId } = useParams();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("stream");

  const { data, isLoading } = useCourseStream(courseId);

  const enrol = useMutation({
    mutationFn: async (joined: boolean) =>
      joined ? api.delete(`/courses/${courseId}/enroll`) : api.post(`/courses/${courseId}/enroll`),
    onSuccess: (_r, joined) => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      toast.success(joined ? "Left the course" : "You joined the course");
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  const mySubmissions = useMemo(() => {
    const map = new Map<string, Submission>();
    for (const s of data?.submissions ?? []) {
      if (s.student_id === user?.student_id) map.set(s.assignment_id, s);
    }
    return map;
  }, [data?.submissions, user?.student_id]);

  if (isLoading || !data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-56 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const { course, assignments, announcements, submissions } = data;
  const joined = course.enrolled.includes(user?.student_id ?? "");
  const pending = submissions.filter((s) => s.status === "submitted").length;

  const tabs = [
    { value: "stream", label: "Stream" },
    { value: "classwork", label: "Classwork", count: assignments.length },
    ...(isAdmin ? [{ value: "submissions", label: "Submissions", count: submissions.length }] : []),
    { value: "people", label: "People", count: course.enrolled.length },
  ];

  return (
    <>
      <Link
        to="/courses"
        className="mb-5 inline-flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        All courses
      </Link>

      <CourseBanner
        course={course}
        action={
          !isAdmin && (
            <Button
              variant={joined ? "outline" : "default"}
              disabled={enrol.isPending}
              onClick={() => enrol.mutate(joined)}
            >
              {joined ? "Leave course" : "Join course"}
            </Button>
          )
        }
      />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <FilterTabs value={tab} onChange={setTab} options={tabs} />
        {isAdmin && pending > 0 && (
          <StatusPill tone="amber" icon={ClipboardCheck}>
            {pending} awaiting review
          </StatusPill>
        )}
      </div>

      {tab === "stream" && (
        <CourseStreamTab
          courseId={course.id}
          assignments={assignments}
          announcements={announcements}
          mySubmissions={mySubmissions}
        />
      )}

      {tab === "classwork" &&
        (assignments.length === 0 ? (
          <EmptyState icon={NotebookPen} title="No classwork" description="Nothing has been assigned yet." />
        ) : (
          <div className="space-y-3">
            {assignments.map((a) => {
              const mine = mySubmissions.get(a.id);
              const forThis = submissions.filter((s) => s.assignment_id === a.id);
              return (
                <Link
                  key={a.id}
                  to={`/assignments/${a.id}`}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-ink/12 bg-card p-5 transition-colors hover:border-ink/25"
                >
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <StatusPill tone="blue">{a.course}</StatusPill>
                      {mine && (
                        <StatusPill tone={SUBMISSION_TONE[mine.status]}>
                          {SUBMISSION_LABEL[mine.status]}
                        </StatusPill>
                      )}
                      {isAdmin && (
                        <span className="tnum text-[11px] text-muted-foreground">
                          {forThis.length} submitted
                        </span>
                      )}
                    </div>
                    <h3 className="text-[15px] font-semibold tracking-tight">{a.title}</h3>
                    <p className="mt-1.5 line-clamp-1 text-[13px] text-muted-foreground">{a.description}</p>
                  </div>
                  <div className="rounded-md border border-ink/12 bg-paper-deep/50 px-3 py-2 text-right">
                    <div className="eyebrow text-muted-foreground">Due</div>
                    <div className="tnum mt-1 text-[13px] font-semibold">{a.deadline}</div>
                    <div className="tnum text-[11px] text-muted-foreground">
                      {deadlineLabel(a.deadline, Boolean(mine))}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ))}

      {tab === "submissions" &&
        isAdmin &&
        (submissions.length === 0 ? (
          <EmptyState
            icon={ClipboardCheck}
            title="No submissions"
            description="Nothing has been handed in for this course yet."
          />
        ) : (
          <div className="space-y-3">
            {submissions.map((s) => (
              <SubmissionReviewCard
                key={s.id}
                submission={s}
                showAssignment
                totalMarks={assignments.find((a) => a.id === s.assignment_id)?.marks ?? 100}
              />
            ))}
          </div>
        ))}

      {tab === "people" &&
        (course.enrolled.length === 0 ? (
          <EmptyState icon={Users} title="Nobody enrolled" description="No students have joined this course." />
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {course.enrolled.map((studentId) => (
              <li
                key={studentId}
                className="flex items-center gap-3 rounded-md border border-ink/12 bg-card px-4 py-3"
              >
                <span className="grid h-8 w-8 place-items-center rounded-full bg-paper-deep text-[11px] font-bold">
                  {initials(studentId.replace(/[^0-9]/g, "") || "S")}
                </span>
                <span className="tnum text-[13px] font-medium">{studentId}</span>
                {studentId === user?.student_id && (
                  <StatusPill tone="green" className="ml-auto">
                    You
                  </StatusPill>
                )}
              </li>
            ))}
          </ul>
        ))}
    </>
  );
}
