import { Clock, MapPin, User } from "lucide-react";
import type { NextClass } from "@/lib/schedule.utils";
import { Panel } from "@/components/Panel";
import { MetaCell } from "@/components/MetaCell";
import { StatusPill } from "@/components/StatusPill";
import { Skeleton } from "@/components/ui/skeleton";

export function NextClassPanel({
  next,
  loading,
}: {
  next: NextClass | null;
  loading: boolean;
}) {
  return (
    <Panel eyebrow="Up next" title="Your next class" icon={Clock} tone="amber">
      {loading ? (
        <Skeleton className="h-28 w-full" />
      ) : next ? (
        <div>
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
            <span className="text-[26px] leading-none font-bold tracking-tight">
              {next.cls.course}
            </span>
            <StatusPill tone={next.inDays === 0 ? "green" : "blue"}>
              {next.inDays === 0 ? "Today" : next.inDays === 1 ? "Tomorrow" : next.cls.day}
            </StatusPill>
          </div>
          <p className="mt-2 text-[13px] text-muted-foreground">{next.cls.title}</p>

          <div className="mt-5 grid grid-cols-2 gap-4 border-t border-ink/10 pt-4 sm:grid-cols-3">
            <MetaCell
              label="Time"
              icon={Clock}
              value={`${next.cls.start_time}–${next.cls.end_time}`}
            />
            <MetaCell label="Room" icon={MapPin} value={next.cls.room} />
            <MetaCell label="Instructor" icon={User} value={next.cls.instructor} />
          </div>
        </div>
      ) : (
        <p className="text-[13px] text-muted-foreground">Nothing scheduled in the week ahead.</p>
      )}
    </Panel>
  );
}
