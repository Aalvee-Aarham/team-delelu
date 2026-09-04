import { AlertCircle, RefreshCw, Volume2, Loader2 } from "lucide-react";
import type { AgentResponse, CampusAnalytics } from "@/lib/types";
import { ToolTrace } from "@/components/ToolTrace";
import { AnalyticsChart } from "@/components/AnalyticsChart";
import { Button } from "@/components/ui/button";

export interface Turn {
  id: number;
  question: string;
  answer: string;
  result: AgentResponse | null;
  error?: string;
  stale?: { collection: string; id: string } | null;
  previous?: string;
  refreshing?: boolean;
  chart?: CampusAnalytics | null;
  audioUrl?: string;
  speaking?: boolean;
}

export function ChatTurn({
  turn,
  onRefresh,
  onSpeak,
}: {
  turn: Turn;
  onRefresh: (turn: Turn) => void;
  onSpeak?: (turn: Turn) => void;
}) {
  return (
    <div className="animate-fade-up space-y-3">
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-lg rounded-br-sm bg-ink px-4 py-2.5 text-[13px] leading-relaxed text-paper">
          {turn.question}
        </div>
      </div>

      <div className="flex justify-start">
        <div
          className={`max-w-[88%] rounded-lg rounded-bl-sm border px-4 py-3.5 text-[13px] transition-colors ${
            turn.stale ? "border-warn/50 bg-warn/10" : "border-ink/12 bg-card"
          }`}
        >
          {turn.error ? (
            <div className="flex items-start gap-2 text-[#b91c1c]">
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
                <div className="mb-3 rounded border border-ink/10 bg-paper-deep/60 p-2.5 text-[12px] text-muted-foreground line-through decoration-destructive/60">
                  {turn.previous}
                </div>
              )}

              <div className="flex items-start justify-between gap-2">
                <div
                  className={`leading-relaxed whitespace-pre-wrap ${
                    turn.stale ? "text-muted-foreground line-through decoration-warn" : ""
                  }`}
                >
                  {turn.answer}
                </div>
                {onSpeak && !turn.stale && (
                  <button
                    type="button"
                    onClick={() => onSpeak(turn)}
                    disabled={turn.speaking}
                    title="Play spoken reply"
                    className="mt-0.5 shrink-0 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
                  >
                    {turn.speaking ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Volume2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                )}
              </div>

              {turn.chart && !turn.stale && <AnalyticsChart data={turn.chart} />}

              {turn.stale && (
                <div className="mt-3.5 flex flex-wrap items-center justify-between gap-3 rounded border border-warn/45 bg-warn/15 px-3 py-2.5">
                  <span className="text-[12px] text-[#8a6608]">
                    This changed while you were reading — {turn.stale.collection} {turn.stale.id} was
                    just edited.
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onRefresh(turn)}
                    disabled={turn.refreshing}
                  >
                    <RefreshCw className={turn.refreshing ? "animate-spin" : ""} />
                    {turn.refreshing ? "Re-checking…" : "Refresh answer"}
                  </Button>
                </div>
              )}

              {turn.result && <ToolTrace result={turn.result} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
