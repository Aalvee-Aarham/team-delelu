export type Tone = "ink" | "blue" | "amber" | "red" | "green" | "violet" | "cyan";

export const TONE_TILE: Record<Tone, string> = {
  ink: "bg-ink text-paper",
  blue: "bg-primary text-white",
  amber: "bg-warn text-ink",
  red: "bg-destructive text-white",
  green: "bg-ok text-white",
  violet: "bg-violet text-white",
  cyan: "bg-info text-white",
};

export const TONE_CHIP: Record<Tone, string> = {
  ink: "border-ink/20 bg-ink/10 text-ink",
  blue: "border-primary/30 bg-primary/10 text-primary",
  amber: "border-warn/45 bg-warn/18 text-[#8a6608]",
  red: "border-destructive/30 bg-destructive/10 text-[#b91c1c]",
  green: "border-ok/35 bg-ok/12 text-[#15803d]",
  violet: "border-violet/30 bg-violet/12 text-[#6d28d9]",
  cyan: "border-info/30 bg-info/12 text-[#0369a1]",
};

export const TONE_BAR: Record<Tone, string> = {
  ink: "bg-ink",
  blue: "bg-primary",
  amber: "bg-warn",
  red: "bg-destructive",
  green: "bg-ok",
  violet: "bg-violet",
  cyan: "bg-info",
};

export const TONE_EDGE: Record<Tone, string> = {
  ink: "border-l-ink",
  blue: "border-l-primary",
  amber: "border-l-warn",
  red: "border-l-destructive",
  green: "border-l-ok",
  violet: "border-l-violet",
  cyan: "border-l-info",
};

export const TONE_TEXT: Record<Tone, string> = {
  ink: "text-ink",
  blue: "text-primary",
  amber: "text-[#8a6608]",
  red: "text-[#b91c1c]",
  green: "text-[#15803d]",
  violet: "text-[#6d28d9]",
  cyan: "text-[#0369a1]",
};

export const PRIORITY_TONE: Record<string, Tone> = {
  high: "red",
  medium: "amber",
  low: "ink",
};

export const EVENT_TONE: Record<string, Tone> = {
  upcoming: "blue",
  ongoing: "green",
  completed: "ink",
  cancelled: "red",
  full: "amber",
};

export const ASSIGNMENT_TONE: Record<string, Tone> = {
  pending: "amber",
  submitted: "blue",
  graded: "green",
  late: "red",
};

export const ROOM_TONE: Record<string, Tone> = {
  classroom: "blue",
  lab: "violet",
  seminar: "cyan",
};
