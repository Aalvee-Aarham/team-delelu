import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CircleCheck, Search, SlidersHorizontal, X } from "lucide-react";
import { api } from "@/lib/axios";
import { Panel } from "@/components/Panel";
import { FilterTabs } from "@/components/FilterTabs";
import { StatusPill } from "@/components/StatusPill";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const TYPES = ["classroom", "lab", "seminar"];

interface AvailabilityResult {
  available: { room_number: string; type: string; capacity: number; equipment: string[] }[];
  conflicts: { room_number: string; reason: { type: string; detail: string } }[];
}

export interface RoomFilters {
  type: string;
  minCapacity: string;
  equipment: string;
}

export function RoomFinder({
  filters,
  onFiltersChange,
}: {
  filters: RoomFilters;
  onFiltersChange: (f: RoomFilters) => void;
}) {
  const [check, setCheck] = useState({ date: "", start_time: "", end_time: "" });
  const [checkKey, setCheckKey] = useState(0);

  const availability = useQuery({
    queryKey: ["availability", checkKey],
    enabled: checkKey > 0,
    queryFn: async () =>
      (
        await api.get<AvailabilityResult>("/rooms/availability", {
          params: {
            date: check.date,
            start_time: check.start_time,
            end_time: check.end_time,
            min_capacity: filters.minCapacity || undefined,
            equipment: filters.equipment || undefined,
          },
        })
      ).data,
  });

  return (
    <Panel
      eyebrow="Room finder"
      title="Filter and check availability"
      description="A timetabled class blocks a room just as a booking does — both are counted here."
      icon={SlidersHorizontal}
      tone="blue"
      className="mb-6"
      bodyClassName="p-5 space-y-5"
    >
      <div className="flex flex-wrap items-end gap-4">
        <div className="grid gap-2">
          <span className="text-xs leading-none font-medium text-muted-foreground">Room type</span>
          <FilterTabs
            value={filters.type}
            onChange={(type) => onFiltersChange({ ...filters, type })}
            options={[{ value: "", label: "All" }, ...TYPES.map((t) => ({ value: t, label: t }))]}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="min-capacity">Min capacity</Label>
          <Input
            id="min-capacity"
            className="w-28"
            type="number"
            placeholder="30"
            value={filters.minCapacity}
            onChange={(e) => onFiltersChange({ ...filters, minCapacity: e.target.value })}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="equipment">Equipment</Label>
          <Input
            id="equipment"
            className="w-56"
            placeholder="projector, AC"
            value={filters.equipment}
            onChange={(e) => onFiltersChange({ ...filters, equipment: e.target.value })}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-4 border-t border-ink/10 pt-5">
        <div className="grid gap-2">
          <Label htmlFor="check-date">Date</Label>
          <Input
            id="check-date"
            type="date"
            className="w-44"
            value={check.date}
            onChange={(e) => setCheck({ ...check, date: e.target.value })}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="check-from">From</Label>
          <Input
            id="check-from"
            className="w-24"
            placeholder="14:00"
            value={check.start_time}
            onChange={(e) => setCheck({ ...check, start_time: e.target.value })}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="check-to">To</Label>
          <Input
            id="check-to"
            className="w-24"
            placeholder="16:00"
            value={check.end_time}
            onChange={(e) => setCheck({ ...check, end_time: e.target.value })}
          />
        </div>
        <Button
          disabled={!check.date || !check.start_time || !check.end_time}
          onClick={() => setCheckKey((k) => k + 1)}
        >
          <Search />
          Check availability
        </Button>
        {checkKey > 0 && (
          <Button variant="ghost" onClick={() => setCheckKey(0)}>
            <X />
            Clear
          </Button>
        )}
      </div>

      {checkKey > 0 && availability.data && (
        <div className="rounded-md border border-ink/12 bg-paper-deep/50 p-4">
          <div className="mb-3 flex items-center gap-2">
            <CircleCheck className="h-4 w-4 text-ok" />
            <span className="text-[13px] font-semibold">
              {availability.data.available.length} rooms free
            </span>
            <span className="tnum text-[12px] text-muted-foreground">
              {check.date}, {check.start_time}–{check.end_time}
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {availability.data.available.map((r) => (
              <StatusPill key={r.room_number} tone="green">
                {r.room_number} · {r.capacity}
              </StatusPill>
            ))}
          </div>

          {availability.data.conflicts.length > 0 && (
            <details className="mt-4">
              <summary className="cursor-pointer text-[12px] font-medium text-muted-foreground hover:text-foreground">
                {availability.data.conflicts.length} busy — see why
              </summary>
              <ul className="mt-2.5 space-y-1.5 text-[12px] text-muted-foreground">
                {availability.data.conflicts.map((c) => (
                  <li key={c.room_number}>
                    <span className="font-semibold text-foreground">{c.room_number}</span> —{" "}
                    {c.reason.detail}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </Panel>
  );
}
