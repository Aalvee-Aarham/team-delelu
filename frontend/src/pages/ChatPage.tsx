import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Send, RefreshCw, AlertCircle, Sparkles, BarChart3 } from "lucide-react";
import { api, apiErrorMessage } from "@/lib/axios";
import { onCampusChange } from "@/hooks/useChangeStream";
import { useAuth } from "@/context/AuthContext";
import type { AgentResponse, CampusAnalytics, ChangeEvent } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToolTrace } from "@/components/ToolTrace";
import { AnalyticsChart } from "@/components/AnalyticsChart";

interface Turn {
  id: number;
  question: string;
  answer: string;
  result: AgentResponse | null;
  error?: string;
  stale?: { collection: string; id: string } | null;
  previous?: string;
  refreshing?: boolean;
  chart?: CampusAnalytics | null;
}

const STARTERS = [
  "When is my next class?",
  "What assignments do I have due this week?",
  "Show me all high priority announcements.",
  "I'm free until 2 PM — is there anything on campus I could drop into?",
  "Which labs have a projector and can fit at least 30 people?",
  "Book Room 7A02 tomorrow from 3 PM to 5 PM.",
];

const ANALYTICS_CHIPS = ["📊 Generate Campus Analytics", "Analyze Room Utilization"];

async function fetchChartIfRequested(data: AgentResponse): Promise<CampusAnalytics | null> {
  const call = data.toolCalls.find((c) => c.tool === "get_campus_analytics" && c.ok);
  if (!call) return null;
  const date = typeof call.args.date === "string" ? call.args.date : undefined;
  const { data: analytics } = await api.get<CampusAnalytics>("/analytics", { params: date ? { date } : undefined });
  return analytics;
}

export default function ChatPage() {
  const { user } = useAuth();
  const [input, setInput] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(1);

  const ask = useMutation({
    mutationFn: async (payload: { messages: { role: "user" | "assistant"; content: string }[] }) =>
      (await api.post<AgentResponse>("/agent/chat", payload)).data,
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns]);

  useEffect(
    () =>
      onCampusChange((event: ChangeEvent) => {
        setTurns((prev) =>
          prev.map((turn) => {
            if (!turn.result || turn.stale) return turn;
            const touched = turn.result.provenance.some(
              (p) => p.collection === event.collection && p.id === event.id
            );
            return touched ? { ...turn, stale: { collection: event.collection, id: event.id } } : turn;
          })
        );
      }),
    []
  );

  const history = (upTo: number) =>
    turns.slice(0, upTo).flatMap((t) =>
      t.answer
        ? [
            { role: "user" as const, content: t.question },
            { role: "assistant" as const, content: t.answer },
          ]
        : []
    );

  const send = (question: string) => {
    if (!question.trim() || ask.isPending) return;
    const id = nextId.current++;
    const index = turns.length;
    setTurns((t) => [...t, { id, question, answer: "", result: null }]);
    setInput("");

    ask.mutate(
      { messages: [...history(index), { role: "user", content: question }] },
      {
        onSuccess: (data) => {
          setTurns((t) => t.map((x) => (x.id === id ? { ...x, answer: data.reply, result: data } : x)));
          fetchChartIfRequested(data).then((chart) => {
            if (chart) setTurns((t) => t.map((x) => (x.id === id ? { ...x, chart } : x)));
          });
        },
        onError: (err) =>
          setTurns((t) => t.map((x) => (x.id === id ? { ...x, error: apiErrorMessage(err) } : x))),
      }
    );
  };

  const refresh = (turn: Turn) => {
    setTurns((t) => t.map((x) => (x.id === turn.id ? { ...x, refreshing: true } : x)));
    api
      .post<AgentResponse>("/agent/chat", { messages: [{ role: "user", content: turn.question }] })
      .then(({ data }) => {
        setTurns((t) =>
          t.map((x) =>
            x.id === turn.id
              ? { ...x, previous: x.answer, answer: data.reply, result: data, stale: null, refreshing: false }
              : x
          )
        );
        fetchChartIfRequested(data).then((chart) => {
          if (chart) setTurns((t) => t.map((x) => (x.id === turn.id ? { ...x, chart } : x)));
        });
      })
      .catch((err) =>
        setTurns((t) => t.map((x) => (x.id === turn.id ? { ...x, error: apiErrorMessage(err), refreshing: false } : x)))
      );
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold tracking-tight">AI Agent</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Reads live campus data on every question. Signed in as {user?.name} ({user?.role}).
        </p>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto pr-1">
        {turns.length === 0 && (
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium">
              <Sparkles className="h-4 w-4 text-primary" /> Try asking
            </div>
            <div className="flex flex-wrap gap-2">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-lg border border-border bg-background px-3 py-1.5 text-left text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {turns.map((turn) => (
          <div key={turn.id} className="animate-fade-up space-y-2">
            <div className="flex justify-end">
              <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-primary px-4 py-2 text-sm text-primary-foreground">
                {turn.question}
              </div>
            </div>

            <div className="flex justify-start">
              <div
                className={`max-w-[85%] rounded-2xl rounded-bl-sm border px-4 py-3 text-sm transition-all ${
                  turn.stale ? "border-warn/50 bg-warn/5" : "border-border bg-card"
                }`}
              >
                {turn.error ? (
                  <div className="flex items-start gap-2 text-destructive">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    {turn.error}
                  </div>
                ) : !turn.answer ? (
                  <div className="flex gap-1 py-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" />
                  </div>
                ) : (
                  <>
                    {turn.previous && (
                      <div className="mb-2 rounded-lg border border-border bg-background/60 p-2 text-xs text-muted-foreground line-through decoration-destructive/60">
                        {turn.previous}
                      </div>
                    )}

                    <div className={`whitespace-pre-wrap leading-relaxed ${turn.stale ? "text-muted-foreground line-through decoration-warn/60" : ""}`}>
                      {turn.answer}
                    </div>

                    {turn.stale && (
                      <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-warn/40 bg-warn/10 px-3 py-2">
                        <span className="text-xs text-warn">
                          This changed while you were reading — {turn.stale.collection} {turn.stale.id} was just edited.
                        </span>
                        <Button size="sm" variant="outline" className="h-7 gap-1.5 text-xs" onClick={() => refresh(turn)} disabled={turn.refreshing}>
                          <RefreshCw className={`h-3 w-3 ${turn.refreshing ? "animate-spin" : ""}`} />
                          {turn.refreshing ? "Re-checking…" : "Refresh answer"}
                        </Button>
                      </div>
                    )}

                    {turn.chart && !turn.stale && <AnalyticsChart data={turn.chart} />}

                    {turn.result && <ToolTrace result={turn.result} />}
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {ANALYTICS_CHIPS.map((chip) => (
          <button
            key={chip}
            onClick={() => send(chip.replace("📊 ", ""))}
            disabled={ask.isPending}
            className="flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs text-primary transition-colors hover:bg-primary/10 disabled:opacity-50"
          >
            <BarChart3 className="h-3 w-3" />
            {chip.replace("📊 ", "")}
          </button>
        ))}
      </div>

      <form
        className="mt-3 flex gap-2 border-t border-border pt-4"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about classes, rooms, events, deadlines…"
          disabled={ask.isPending}
        />
        <Button type="submit" disabled={ask.isPending || !input.trim()} className="gap-2">
          <Send className="h-4 w-4" />
          Send
        </Button>
      </form>
    </div>
  );
}
