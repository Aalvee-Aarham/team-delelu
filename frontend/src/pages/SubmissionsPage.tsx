import { useMemo, useState } from "react";
import { CheckCircle2, ClipboardCheck, Clock, Inbox, TimerOff } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { FilterTabs } from "@/components/FilterTabs";
import { EmptyState } from "@/components/EmptyState";
import { StatTile } from "@/components/StatTile";
import { SubmissionReviewCard } from "@/components/SubmissionReviewCard";
import { useSubmissions } from "@/hooks/useClassroom";
import { useResourceList } from "@/hooks/useResource";
import { useAuth } from "@/context/AuthContext";
import { SUBMISSION_LABEL } from "@/lib/classroom.utils";
import type { Assignment, Submission } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

const STATUSES: Submission["status"][] = ["submitted", "accepted", "returned", "rejected"];

export default function SubmissionsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [status, setStatus] = useState("");

  const { data, isLoading } = useSubmissions();
  const { data: assignments } = useResourceList<Assignment>("assignments");

  const marksFor = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of assignments ?? []) map.set(a.id, a.marks);
    return map;
  }, [assignments]);

  const rows = useMemo(
    () => (data ?? []).filter((s) => !status || s.status === status),
    [data, status]
  );

  const grouped = useMemo(() => {
    const map = new Map<string, Submission[]>();
    for (const s of rows) {
      const key = s.course_code || "Unassigned";
      const list = map.get(key) ?? [];
      list.push(s);
      map.set(key, list);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [rows]);

  const counts = useMemo(() => {
    const all = data ?? [];
    return {
      total: all.length,
      pending: all.filter((s) => s.status === "submitted").length,
      accepted: all.filter((s) => s.status === "accepted").length,
      late: all.filter((s) => s.late).length,
    };
  }, [data]);

  return (
    <>
      <PageHeader
        eyebrow={isAdmin ? "Review" : "Academics"}
        title={isAdmin ? "Submissions" : "My submissions"}
        subtitle={
          isAdmin
            ? "Everything students have handed in, grouped by course. Accept, return for edits or reject with feedback."
            : "Every piece of work you have handed in, with the grade and feedback once it has been reviewed."
        }
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Total" value={counts.total} icon={Inbox} tone="ink" />
        <StatTile label="Awaiting review" value={counts.pending} icon={Clock} tone="amber" />
        <StatTile label="Accepted" value={counts.accepted} icon={CheckCircle2} tone="green" />
        <StatTile label="Late" value={counts.late} icon={TimerOff} tone="red" />
      </div>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <FilterTabs
          value={status}
          onChange={setStatus}
          options={[
            { value: "", label: "All" },
            ...STATUSES.map((s) => ({
              value: s,
              label: SUBMISSION_LABEL[s],
              count: (data ?? []).filter((x) => x.status === s).length,
            })),
          ]}
        />
        <span className="eyebrow text-muted-foreground">
          {rows.length} {rows.length === 1 ? "submission" : "submissions"}
        </span>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : grouped.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="No submissions"
          description={
            isAdmin
              ? "Nothing matches this filter. Students hand work in from the assignment page."
              : "You have not handed anything in yet. Open an assignment to submit your work."
          }
        />
      ) : (
        <div className="space-y-8">
          {grouped.map(([courseCode, list]) => (
            <section key={courseCode}>
              <div className="mb-3 flex items-center gap-3">
                <h2 className="text-[15px] font-semibold tracking-tight">{courseCode}</h2>
                <div className="rule-dotted h-px flex-1" />
                <span className="tnum text-[11px] text-muted-foreground">
                  {list.length} {list.length === 1 ? "submission" : "submissions"}
                </span>
              </div>
              <div className="space-y-3">
                {list.map((s) => (
                  <SubmissionReviewCard
                    key={s.id}
                    submission={s}
                    showAssignment
                    totalMarks={marksFor.get(s.assignment_id) ?? 100}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
