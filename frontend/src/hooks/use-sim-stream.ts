"use client";

import { useEffect, useState } from "react";

export interface SimStreamEvent {
  status: "pending" | "running" | "completed" | "failed";
  progress: number;
  responses: number;
  error?: string | null;
}

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

const TERMINAL = new Set(["completed", "failed"]);

export function useSimStream(simId: number, initialStatus?: string) {
  const [state, setState] = useState<SimStreamEvent>(() => ({
    status: (initialStatus as SimStreamEvent["status"]) ?? "pending",
    progress: TERMINAL.has(initialStatus ?? "") ? 1 : 0,
    responses: 0,
  }));
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // For terminal sims, do a single fetch to populate the actual response
    // count (the SSE stream would close immediately and never deliver one).
    if (TERMINAL.has(state.status)) {
      let cancelled = false;
      fetch(`${BASE}/simulations/${simId}/responses`)
        .then((r) => (r.ok ? r.json() : []))
        .then((rs: unknown[]) => {
          if (!cancelled) {
            setState((s) => ({ ...s, responses: rs.length, progress: 1 }));
          }
        })
        .catch(() => {});
      return () => {
        cancelled = true;
      };
    }

    const url = `${BASE}/simulations/${simId}/stream`;
    const es = new EventSource(url);
    setConnected(true);

    es.addEventListener("progress", (evt) => {
      try {
        const data = JSON.parse((evt as MessageEvent).data);
        setState((s) => ({ ...s, ...data }));
      } catch {
        // ignore
      }
    });

    es.addEventListener("done", () => {
      es.close();
      setConnected(false);
    });

    es.addEventListener("error", () => {
      es.close();
      setConnected(false);
    });

    return () => {
      es.close();
      setConnected(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [simId]);

  return { ...state, connected };
}
