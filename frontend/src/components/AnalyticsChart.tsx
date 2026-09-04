import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { CampusAnalytics } from "@/lib/types";

const UTILIZATION_COLORS = ["#3987e5", "#199e70"];
const STATUS_COLORS: Record<string, string> = {
  pending: "#3987e5",
  submitted: "#d95926",
  graded: "#199e70",
  late: "#c98500",
};

const tooltipStyle = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  fontSize: 11,
  color: "var(--foreground)",
};

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-background/60 p-3">
      <div className="mb-2 text-[11px] font-medium text-muted-foreground">{title}</div>
      {children}
    </div>
  );
}

function UtilizationDonut({ data }: { data: CampusAnalytics["roomUtilization"] }) {
  const slices = [
    { name: "Busy", value: data.busy },
    { name: "Free", value: data.free },
  ];
  return (
    <ChartCard title={`Room utilization — ${data.total} rooms`}>
      <div className="flex items-center gap-3">
        <PieChart width={90} height={90}>
          <Pie data={slices} dataKey="value" innerRadius={26} outerRadius={40} paddingAngle={2} stroke="var(--background)" strokeWidth={2}>
            {slices.map((s, i) => (
              <Cell key={s.name} fill={UTILIZATION_COLORS[i]} />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} />
        </PieChart>
        <div className="space-y-1 text-[11px]">
          {slices.map((s, i) => (
            <div key={s.name} className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: UTILIZATION_COLORS[i] }} />
              <span className="text-muted-foreground">{s.name}</span>
              <span className="font-medium text-foreground">{s.value}</span>
            </div>
          ))}
        </div>
      </div>
    </ChartCard>
  );
}

function AssignmentStatusDonut({ data }: { data: CampusAnalytics["assignmentStatus"] }) {
  if (data.length === 0) return null;
  return (
    <ChartCard title="Assignment status">
      <div className="flex items-center gap-3">
        <PieChart width={90} height={90}>
          <Pie data={data} dataKey="count" nameKey="status" innerRadius={26} outerRadius={40} paddingAngle={2} stroke="var(--background)" strokeWidth={2}>
            {data.map((s) => (
              <Cell key={s.status} fill={STATUS_COLORS[s.status] ?? "#8296ad"} />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} />
        </PieChart>
        <div className="space-y-1 text-[11px]">
          {data.map((s) => (
            <div key={s.status} className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: STATUS_COLORS[s.status] ?? "#8296ad" }} />
              <span className="capitalize text-muted-foreground">{s.status}</span>
              <span className="font-medium text-foreground">{s.count}</span>
            </div>
          ))}
        </div>
      </div>
    </ChartCard>
  );
}

function BookingsByHourBar({ data }: { data: CampusAnalytics["bookingsByHour"] }) {
  if (data.length === 0) return null;
  const rows = data.map((d) => ({ ...d, label: `${String(d.hour).padStart(2, "0")}:00` }));
  return (
    <ChartCard title="Peak booking hours">
      <ResponsiveContainer width="100%" height={90}>
        <BarChart data={rows} barCategoryGap={4}>
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={{ stroke: "var(--border)" }} tickLine={false} />
          <YAxis hide allowDecimals={false} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--secondary)" }} />
          <Bar dataKey="count" fill="#3987e5" radius={[4, 4, 0, 0]} maxBarSize={24} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

function WeeklyClassLoadBar({ data }: { data: CampusAnalytics["weeklyClassLoad"] }) {
  return (
    <ChartCard title="Weekly class load">
      <ResponsiveContainer width="100%" height={90}>
        <BarChart data={data} barCategoryGap={4}>
          <XAxis dataKey="day" tickFormatter={(d: string) => d.slice(0, 3)} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={{ stroke: "var(--border)" }} tickLine={false} />
          <YAxis hide allowDecimals={false} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--secondary)" }} />
          <Bar dataKey="count" fill="#9085e9" radius={[4, 4, 0, 0]} maxBarSize={24} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

function EventCapacityMeters({ data }: { data: CampusAnalytics["eventCapacity"] }) {
  if (data.length === 0) return null;
  return (
    <ChartCard title="Event capacity vs. registered">
      <div className="space-y-2">
        {data.slice(0, 6).map((e) => {
          const pct = Math.min(100, Math.round((e.registered / e.capacity) * 100));
          return (
            <div key={e.event}>
              <div className="mb-0.5 flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="truncate pr-2">{e.event}</span>
                <span className="shrink-0">
                  {e.registered}/{e.capacity}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                <div className={`h-full rounded-full ${pct >= 100 ? "bg-warn" : "bg-primary"}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </ChartCard>
  );
}

export function AnalyticsChart({ data }: { data: CampusAnalytics }) {
  return (
    <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
      <UtilizationDonut data={data.roomUtilization} />
      <AssignmentStatusDonut data={data.assignmentStatus} />
      <BookingsByHourBar data={data.bookingsByHour} />
      <WeeklyClassLoadBar data={data.weeklyClassLoad} />
      <div className="sm:col-span-2">
        <EventCapacityMeters data={data.eventCapacity} />
      </div>
    </div>
  );
}
