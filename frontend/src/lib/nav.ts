import {
  CalendarDays,
  ClipboardCheck,
  DoorOpen,
  GraduationCap,
  LayoutDashboard,
  Megaphone,
  NotebookPen,
  PartyPopper,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  description: string;
}

export interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    id: "overview",
    label: "Overview",
    items: [
      {
        to: "/",
        label: "Dashboard",
        icon: LayoutDashboard,
        description: "Your campus at a glance",
      },
    ],
  },
  {
    id: "academics",
    label: "Academics",
    items: [
      {
        to: "/courses",
        label: "Courses",
        icon: GraduationCap,
        description: "Class streams, classwork and people",
      },
      {
        to: "/schedules",
        label: "Schedule",
        icon: CalendarDays,
        description: "The weekly timetable, Sunday to Thursday",
      },
      {
        to: "/assignments",
        label: "Assignments",
        icon: NotebookPen,
        description: "Grouped by course, soonest deadline first",
      },
      {
        to: "/submissions",
        label: "Submissions",
        icon: ClipboardCheck,
        description: "Work handed in, with grades and feedback",
      },
    ],
  },
  {
    id: "campus",
    label: "Campus",
    items: [
      {
        to: "/rooms",
        label: "Rooms",
        icon: DoorOpen,
        description: "Capacity, equipment and live bookings",
      },
      {
        to: "/events",
        label: "Events",
        icon: PartyPopper,
        description: "What is happening on campus",
      },
      {
        to: "/announcements",
        label: "Announcements",
        icon: Megaphone,
        description: "Notices, highest priority first",
      },
    ],
  },
  {
    id: "assistant",
    label: "Assistant",
    items: [
      {
        to: "/chat",
        label: "AI Agent",
        icon: Sparkles,
        description: "Ask questions and act on live data",
      },
    ],
  },
];

export const NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((group) => group.items);

export function findNavItem(pathname: string): NavItem | undefined {
  if (pathname === "/") return NAV_ITEMS.find((item) => item.to === "/");
  return NAV_ITEMS.find((item) => item.to !== "/" && pathname.startsWith(item.to));
}

export function findNavGroup(pathname: string): NavGroup | undefined {
  const item = findNavItem(pathname);
  if (!item) return undefined;
  return NAV_GROUPS.find((group) => group.items.includes(item));
}
