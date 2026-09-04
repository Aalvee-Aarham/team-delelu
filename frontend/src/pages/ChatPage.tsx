import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ArrowRight, BarChart3, Loader2, Mic, Send, Sparkles, Square } from "lucide-react";
import { api, apiErrorMessage } from "@/lib/axios";
import { onCampusChange } from "@/hooks/useChangeStream";
import { useAuth } from "@/context/AuthContext";
import type { AgentResponse, CampusAnalytics, ChangeEvent } from "@/lib/types";
import { PageHeader } from "@/components/PageHeader";
import { ChatTurn } from "@/components/ChatTurn";
import type { Turn } from "@/components/ChatTurn";
import { StatusPill } from "@/components/StatusPill";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VoiceRecorder, transcribeAudio, speakText } from "@/lib/voice";
import { toast } from "sonner";

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
  const [isRecording, setIsRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(1);
  const recorderRef = useRef<VoiceRecorder | null>(null);

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
        setTurns((t) =>
          t.map((x) => (x.id === turn.id ? { ...x, error: apiErrorMessage(err), refreshing: false } : x))
        )
      );
  };

  const toggleRecording = async () => {
    if (isRecording) {
      const recorder = recorderRef.current;
      if (!recorder) return;
      setIsRecording(false);
      setTranscribing(true);
      try {
        const pcm = recorder.stop();
        const text = await transcribeAudio(pcm);
        if (text) {
          send(text);
        } else {
          toast.error("Didn't catch any speech — try again");
        }
      } catch (err) {
        toast.error(apiErrorMessage(err));
      } finally {
        setTranscribing(false);
        recorderRef.current = null;
      }
      return;
    }
    try {
      const recorder = new VoiceRecorder();
      await recorder.start();
      recorderRef.current = recorder;
      setIsRecording(true);
    } catch {
      toast.error("Microphone access is required to record a question");
    }
  };

  const speak = async (turn: Turn) => {
    if (turn.audioUrl) {
      new Audio(turn.audioUrl).play();
      return;
    }
    setTurns((t) => t.map((x) => (x.id === turn.id ? { ...x, speaking: true } : x)));
    try {
      const url = await speakText(turn.answer);
      setTurns((t) => t.map((x) => (x.id === turn.id ? { ...x, audioUrl: url, speaking: false } : x)));
      new Audio(url).play();
    } catch (err) {
      toast.error(apiErrorMessage(err));
      setTurns((t) => t.map((x) => (x.id === turn.id ? { ...x, speaking: false } : x)));
    }
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
            <ChatTurn key={turn.id} turn={turn} onRefresh={refresh} onSpeak={speak} />
          ))}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-ink/12 bg-card">
          <div className="flex flex-wrap gap-2 px-4 pt-3">
            {ANALYTICS_CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => send(chip.replace("📊 ", ""))}
                disabled={ask.isPending}
                className="flex items-center gap-1.5 rounded-full border border-ink/15 bg-paper-deep/50 px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-ink/35 hover:text-foreground disabled:opacity-50"
              >
                <BarChart3 className="h-3 w-3" />
                {chip.replace("📊 ", "")}
              </button>
            ))}
          </div>

          <form
            className="flex gap-2 p-4"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                isRecording ? "Listening…" : transcribing ? "Transcribing…" : "Ask about classes, rooms, events, deadlines…"
              }
              disabled={ask.isPending || isRecording || transcribing}
              aria-label="Message the agent"
            />
            <Button
              type="button"
              variant={isRecording ? "destructive" : "outline"}
              onClick={toggleRecording}
              disabled={ask.isPending || transcribing}
              className="gap-2"
              title={isRecording ? "Stop recording" : "Record voice query"}
            >
              {transcribing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isRecording ? (
                <Square className="h-4 w-4" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </Button>
            <Button
              type="submit"
              disabled={ask.isPending || !input.trim() || isRecording || transcribing}
              className="gap-2"
            >
              <Send className="h-4 w-4" />
              Send
            </Button>
          </form>
        </div>
      </div>
    </>
  );
}
