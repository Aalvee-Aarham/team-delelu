import { useState } from "react";
import { ChevronRight, Zap, AlertTriangle } from "lucide-react";
import type { AgentResponse } from "@/lib/types";

export function ToolTrace({ result }: { result: AgentResponse }) {
  const [open, setOpen] = useState(false);
  const failedOver = result.failovers.length > 0;

  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronRight className={`h-3 w-3 transition-transform ${open ? "rotate-90" : ""}`} />
        {result.toolCalls.length} tool {result.toolCalls.length === 1 ? "call" : "calls"}
        <span className="text-muted-foreground/60">·</span>
        <span className={failedOver ? "text-warn" : ""}>{result.label}</span>
        <span className="text-muted-foreground/60">·</span>
        {result.latencyMs}ms
        {failedOver && <AlertTriangle className="h-3 w-3 text-warn" />}
      </button>

      {open && (
        <div className="mt-2 space-y-1.5 rounded-lg border border-border bg-background/60 p-2.5">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Zap className="h-3 w-3 text-primary" />
            served by <span className="font-medium text-foreground">{result.provider}</span> · {result.model}
          </div>

          {failedOver && (
            <div className="rounded border border-warn/30 bg-warn/10 p-1.5 text-[11px] text-warn">
              Failed over past {result.failovers.map((f) => f.label).join(", ")}
              <div className="mt-0.5 text-warn/70">{result.failovers[0].error.slice(0, 110)}</div>
            </div>
          )}

          {result.toolCalls.length === 0 ? (
            <div className="text-[11px] text-muted-foreground">No tools called — answered directly.</div>
          ) : (
            result.toolCalls.map((call, i) => (
              <div key={i} className="rounded border border-border bg-card p-2 font-mono text-[11px]">
                <div className="flex items-center justify-between gap-2">
                  <span className={call.ok ? "text-primary" : "text-destructive"}>{call.tool}</span>
                  <span className="shrink-0 text-muted-foreground">
                    {call.rowCount} {call.rowCount === 1 ? "row" : "rows"} · {call.latencyMs}ms
                  </span>
                </div>
                {Object.keys(call.args).length > 0 && (
                  <div className="mt-1 break-all text-muted-foreground">{JSON.stringify(call.args)}</div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
