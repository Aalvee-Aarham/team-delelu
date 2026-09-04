import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, X } from "lucide-react";
import { api } from "@/lib/axios";
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
    <div className="mb-4 rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex flex-wrap items-end gap-3">
        <div className="flex gap-2">
          <Button
            variant={filters.type === "" ? "default" : "outline"}
            size="sm"
            onClick={() => onFiltersChange({ ...filters, type: "" })}
          >
            All
          </Button>
          {TYPES.map((t) => (
            <Button
              key={t}
              variant={filters.type === t ? "default" : "outline"}
              size="sm"
              onClick={() => onFiltersChange({ ...filters, type: t })}
            >
              {t}
            </Button>
          ))}
        </div>
        <div className="grid gap-1.5">
          <Label className="text-xs">Min capacity</Label>
          <Input
            className="h-8 w-28"
            type="number"
            value={filters.minCapacity}
            onChange={(e) => onFiltersChange({ ...filters, minCapacity: e.target.value })}
          />
        </div>
        <div className="grid gap-1.5">
          <Label className="text-xs">Equipment</Label>
          <Input
            className="h-8 w-52"
            placeholder="projector, AC"
            value={filters.equipment}
            onChange={(e) => onFiltersChange({ ...filters, equipment: e.target.value })}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3 border-t border-border pt-3">
        <div className="grid gap-1.5">
          <Label className="text-xs">Date</Label>
          <Input className="h-8" type="date" value={check.date} onChange={(e) => setCheck({ ...check, date: e.target.value })} />
        </div>
        <div className="grid gap-1.5">
          <Label className="text-xs">From</Label>
          <Input
            className="h-8 w-24"
            placeholder="14:00"
            value={check.start_time}
            onChange={(e) => setCheck({ ...check, start_time: e.target.value })}
          />
        </div>
        <div className="grid gap-1.5">
          <Label className="text-xs">To</Label>
          <Input
            className="h-8 w-24"
            placeholder="16:00"
            value={check.end_time}
            onChange={(e) => setCheck({ ...check, end_time: e.target.value })}
          />
        </div>
        <Button
          size="sm"
          className="gap-2"
          disabled={!check.date || !check.start_time || !check.end_time}
          onClick={() => setCheckKey((k) => k + 1)}
        >
          <Search className="h-4 w-4" /> Check availability
        </Button>
        {checkKey > 0 && (
          <Button size="sm" variant="ghost" onClick={() => setCheckKey(0)}>
            <X className="h-4 w-4" /> Clear
          </Button>
        )}
      </div>

      {checkKey > 0 && availability.data && (
        <div className="mt-3 rounded-lg border border-border bg-background p-3 text-sm">
          <div className="mb-2 font-medium text-ok">
            {availability.data.available.length} rooms free on {check.date}, {check.start_time}–{check.end_time}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {availability.data.available.map((r) => (
              <span key={r.room_number} className="rounded border border-ok/40 bg-ok/10 px-2 py-0.5 text-xs text-ok">
                {r.room_number} ({r.capacity})
              </span>
            ))}
          </div>
          {availability.data.conflicts.length > 0 && (
            <details className="mt-3">
              <summary className="cursor-pointer text-xs text-muted-foreground">
                {availability.data.conflicts.length} busy — why?
              </summary>
              <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                {availability.data.conflicts.map((c) => (
                  <li key={c.room_number}>
                    <span className="font-medium text-foreground">{c.room_number}</span> — {c.reason.detail}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
