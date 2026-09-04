import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ArrowRight, Send, Sparkles } from "lucide-react";
import { api, apiErrorMessage } from "@/lib/axios";
import { onCampusChange } from "@/hooks/useChangeStream";
import { useAuth } from "@/context/AuthContext";
import type { AgentResponse, ChangeEvent } from "@/lib/types";
import { PageHeader } from "@/components/PageHeader";
import { ChatTurn } from "@/components/ChatTurn";
import type { Turn } from "@/components/ChatTurn";
import { StatusPill } from "@/components/StatusPill";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const STARTERS = [
  "When is my next class?",
  "What assignments do I have due this week?",
  "Show me all high priority announcements.",
  "I'm free until 2 PM — is there anything on campus I could drop into?",
  "Which labs have a projector and can fit at least 30 people?",
  "Book Room 7A02 tomorrow from 3 PM to 5 PM.",
];

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
        onSuccess: (data) =>
          setTurns((t) => t.map((x) => (x.id === id ? { ...x, answer: data.reply, result: data } : x))),
        onError: (err) =>
          setTurns((t) => t.map((x) => (x.id === id ? { ...x, error: apiErrorMessage(err) } : x))),
      }
    );
  };

  const refresh = (turn: Turn) => {
    setTurns((t) => t.map((x) => (x.id === turn.id ? { ...x, refreshing: true } : x)));
    api
      .post<AgentResponse>("/agent/chat", { messages: [{ role: "user", content: turn.question }] })
      .then(({ data }) =>
        setTurns((t) =>
          t.map((x) =>
            x.id === turn.id
              ? { ...x, previous: x.answer, answer: data.reply, result: data, stale: null, refreshing: false }
              : x
          )
        )
      )
      .catch((err) =>
        setTurns((t) =>
          t.map((x) => (x.id === turn.id ? { ...x, error: apiErrorMessage(err), refreshing: false } : x))
        )
      );
  };

  return (
    <>
      <PageHeader
        eyebrow="Assistant"
        title="AI Agent"
        subtitle="Reads live campus data on every question through real tool calls, and refuses actions your role cannot perform."
        action={
          <StatusPill tone={user?.role === "admin" ? "violet" : "green"}>
            {user?.role} · {user?.name}
          </StatusPill>
        }
      />

      <div className="flex h-[calc(100dvh-15rem)] min-h-[460px] flex-col overflow-hidden rounded-lg border border-ink/12 bg-paper-deep/35">
        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          {turns.length === 0 && (
            <div className="rounded-lg border border-ink/12 bg-card p-6">
              <div className="mb-1 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-violet" />
                <span className="text-[15px] font-semibold tracking-tight">Try asking</span>
              </div>
              <p className="mb-5 text-[13px] text-muted-foreground">
                Every answer records the records it came from, so it can tell you when it goes stale.
              </p>

              <div className="grid gap-2 sm:grid-cols-2">
                {STARTERS.map((starter) => (
                  <button
                    key={starter}
                    type="button"
                    onClick={() => send(starter)}
                    className="group flex items-start justify-between gap-3 rounded-md border border-ink/12 bg-paper-deep/50 px-3.5 py-3 text-left text-[13px] leading-snug text-muted-foreground transition-colors hover:border-ink/35 hover:bg-card hover:text-foreground"
                  >
                    {starter}
                    <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-60" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {turns.map((turn) => (
            <ChatTurn key={turn.id} turn={turn} onRefresh={refresh} />
          ))}
          <div ref={bottomRef} />
        </div>

        <form
          className="flex gap-2 border-t border-ink/12 bg-card p-4"
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
            aria-label="Message the agent"
          />
          <Button type="submit" disabled={ask.isPending || !input.trim()}>
            <Send />
            Send
          </Button>
        </form>
      </div>
    </>
  );
}
