import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { TOKEN_KEY } from "@/lib/axios";
import type { ChangeEvent } from "@/lib/types";

const listeners = new Set<(e: ChangeEvent) => void>();

export function onCampusChange(fn: (e: ChangeEvent) => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function useChangeStream() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;

    const source = new EventSource(`/api/stream?token=${encodeURIComponent(token)}`);

    source.onmessage = (raw) => {
      const event = JSON.parse(raw.data) as ChangeEvent;
      queryClient.invalidateQueries({ queryKey: [event.collection] });
      if (event.collection === "submissions" || event.collection === "courses") {
        queryClient.invalidateQueries({ queryKey: ["courses"] });
        queryClient.invalidateQueries({ queryKey: ["assignments"] });
      }
      for (const fn of listeners) fn(event);
    };

    return () => source.close();
  }, [queryClient]);
}
