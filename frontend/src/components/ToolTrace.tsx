import { useState } from "react";
import { ChevronRight, TriangleAlert, Zap } from "lucide-react";
import type { AgentResponse } from "@/lib/types";

export function ToolTrace({ result }: { result: AgentResponse }) {
  const [open, setOpen] = useState(false);
  const failedOver = result.failovers.length > 0;

  return (
    <div className="mt-3 border-t border-ink/10 pt-2.5">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex items-center gap-1.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronRight className={`h-3 w-3 transition-transform ${open ? "rotate-90" : ""}`} />
        <span className="tnum">{result.toolCalls.length}</span>
        tool {result.toolCalls.length === 1 ? "call" : "calls"}
        <span className="text-ink/25">·</span>
        <span className={failedOver ? "font-medium text-[#8a6608]" : ""}>{result.label}</span>
        <span className="text-ink/25">·</span>
        <span className="tnum">{result.latencyMs}ms</span>
        {failedOver && <TriangleAlert className="h-3 w-3 text-warn" />}
      </button>

      {open && (
        <div className="mt-2.5 space-y-2 rounded border border-ink/10 bg-paper-deep/60 p-3">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Zap className="h-3 w-3 text-primary" />
            served by <span className="font-semibold text-foreground">{result.provider}</span>
            <span className="text-ink/25">·</span>
            <span className="font-mono">{result.model}</span>
          </div>

          {failedOver && (
            <div className="rounded border border-warn/40 bg-warn/15 p-2 text-[11px] text-[#8a6608]">
              Failed over past {result.failovers.map((f) => f.label).join(", ")}
              <div className="mt-1 opacity-80">{result.failovers[0].error.slice(0, 110)}</div>
            </div>
          )}

          {result.toolCalls.length === 0 ? (
            <div className="text-[11px] text-muted-foreground">
              No tools called — answered directly.
            </div>
          ) : (
            result.toolCalls.map((call, i) => (
              <div
                key={`${call.tool}-${i}`}
                className="rounded border border-ink/10 bg-card p-2.5 font-mono text-[11px]"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={call.ok ? "font-medium text-primary" : "text-[#b91c1c]"}>
                    {call.tool}
                  </span>
                  <span className="tnum shrink-0 text-muted-foreground">
                    {call.rowCount} {call.rowCount === 1 ? "row" : "rows"} · {call.latencyMs}ms
                  </span>
                </div>
                {Object.keys(call.args).length > 0 && (
                  <div className="mt-1.5 break-all text-muted-foreground">
                    {JSON.stringify(call.args)}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
