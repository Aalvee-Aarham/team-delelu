import type { Schedule } from "@/lib/types";

export const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export interface NextClass {
  cls: Schedule;
  inDays: number;
}

export function nextClass(schedules: Schedule[], section: string): NextClass | null {
  const now = new Date();
  const nowDay = now.getDay();
  const nowTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const mine = schedules.filter((s) => s.section === section || s.section.includes(section));
  const pool = mine.length > 0 ? mine : schedules;

  for (let offset = 0; offset < 7; offset++) {
    const dayName = DAYS[(nowDay + offset) % 7];
    const onDay = pool
      .filter((s) => s.day === dayName)
      .filter((s) => offset > 0 || s.start_time > nowTime)
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
    if (onDay.length > 0) return { cls: onDay[0], inDays: offset };
  }
  return null;
}
