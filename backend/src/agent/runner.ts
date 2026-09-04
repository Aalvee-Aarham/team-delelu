import { AuthPayload } from "../middleware/auth";
import { completeWithFallback } from "./provider.chain";
import { executeTool, Provenance } from "./tools.executor";
import { ChatMessage } from "./provider.types";

const MAX_ROUNDS = 6;

export interface TraceEntry {
  tool: string;
  args: Record<string, unknown>;
  ok: boolean;
  rowCount: number;
  latencyMs: number;
}

export interface AgentResult {
  reply: string;
  toolCalls: TraceEntry[];
  provenance: Provenance[];
  provider: string;
  model: string;
  label: string;
  failovers: { label: string; error: string }[];
  latencyMs: number;
}

function countRows(data: unknown): number {
  if (Array.isArray(data)) return data.length;
  if (data && typeof data === "object") {
    const values = Object.values(data as Record<string, unknown>);
    const arrays = values.filter(Array.isArray) as unknown[][];
    if (arrays.length > 0) return arrays.reduce((sum, a) => sum + a.length, 0);
    return 1;
  }
  return 0;
}

const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function buildSystemPrompt(auth: AuthPayload): string {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const dayName = WEEKDAY_NAMES[now.getUTCDay()];
  const tomorrow = new Date(now.getTime() + 86400000).toISOString().slice(0, 10);

  const calendar = Array.from({ length: 8 }, (_, i) => {
    const d = new Date(now.getTime() + i * 86400000);
    const label = i === 0 ? " (today)" : i === 1 ? " (tomorrow)" : "";
    return `  ${WEEKDAY_NAMES[d.getUTCDay()]} = ${d.toISOString().slice(0, 10)}${label}`;
  }).join("\n");

  return [
    "You are CampusOS, the assistant for a university campus system at AUST.",
    "",
    `Today is ${dayName}, ${today}. Tomorrow is ${tomorrow}.`,
    "Never compute dates yourself. Use exactly this calendar for the next eight days:",
    calendar,
    `"This week" means from today (${today}) through the next seven days inclusive.`,
    "The academic week runs Sunday to Thursday. Friday and Saturday are the weekend and have no classes.",
    "All times are 24-hour HH:MM. All dates are ISO YYYY-MM-DD.",
    "",
    `You are speaking with ${auth.name} (student ID ${auth.student_id}, section ${auth.section}, role ${auth.role}).`,
    `When the user says "my", "me" or "I", they mean this person. Their classes are the ones whose section is "${auth.section}" or that apply to all sections.`,
    "",
    "RULES",
    "1. Never answer from memory or assumption. Always call a tool to read the current data first. The data changes constantly and your training knowledge of it is worthless.",
    "2. Announcements override the timetable. If an announcement says a class moved, was cancelled or was rescheduled, that is the truth — mention it. When asked where or when a class is, check both get_schedule AND get_announcements.",
    "3. If a request is missing information you need to act (which room, what time, which date, how many people), ASK a short clarifying question. Do not guess and do not take the action. 'Book me any room tomorrow afternoon' is too vague: ask which time window and which room, and do not book anything.",
    "4. If a tool returns permission_denied, tell the user plainly that they are not authorised to do that and do not attempt a workaround. Students cannot cancel classes, edit the timetable, or post/delete announcements. They also cannot cancel other people's bookings.",
    "5. Before booking, verify availability. If the room is busy, say why it is busy and offer genuinely free alternatives.",
    "6. Be concise and direct. Give the specific answer — course code, time, room — not a summary of what you looked up. Never invent a room, time, course or event that was not in a tool result.",
  ].join("\n");
}

export async function runAgent(messages: { role: "user" | "assistant"; content: string }[], auth: AuthPayload): Promise<AgentResult> {
  const started = Date.now();
  const history: ChatMessage[] = [
    { role: "system", content: buildSystemPrompt(auth) },
    ...messages.map((m) => ({ role: m.role, content: m.content })),
  ];

  const trace: TraceEntry[] = [];
  const provenance: Provenance[] = [];
  const failovers: { label: string; error: string }[] = [];
  let servedBy = "";
  let model = "";
  let providerName = "";

  for (let round = 0; round < MAX_ROUNDS; round++) {
    const reply = await completeWithFallback(history);
    failovers.push(...reply.attempts);
    servedBy = reply.servedBy.label;
    model = reply.servedBy.model;
    providerName = reply.servedBy.provider;

    if (reply.toolCalls.length === 0) {
      return {
        reply: reply.content,
        toolCalls: trace,
        provenance,
        provider: providerName,
        model,
        label: servedBy,
        failovers,
        latencyMs: Date.now() - started,
      };
    }

    history.push({ role: "assistant", content: reply.content, tool_calls: reply.toolCalls });

    for (const call of reply.toolCalls) {
      const toolStart = Date.now();
      const result = await executeTool(call.name, call.args, auth);
      trace.push({
        tool: call.name,
        args: call.args,
        ok: result.ok,
        rowCount: countRows(result.data),
        latencyMs: Date.now() - toolStart,
      });
      provenance.push(...result.provenance);
      history.push({
        role: "tool",
        tool_call_id: call.id,
        name: call.name,
        content: JSON.stringify(result.data),
      });
    }
  }

  return {
    reply: "I looked into that but could not settle on an answer within a reasonable number of steps. Could you narrow the question down?",
    toolCalls: trace,
    provenance,
    provider: providerName,
    model,
    label: servedBy,
    failovers,
    latencyMs: Date.now() - started,
  };
}
