"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface ResponseRow {
  id: number;
  persona_id: number;
  response: {
    purchase_intent: number;
    sentiment: string;
    top_concern: string;
    top_positive: string;
    would_recommend: string;
    reasoning: string;
  };
  sentiment: string;
  purchase_intent: number;
  latency_ms: number;
  failed: boolean;
  error?: string | null;
}

interface PersonaSummary {
  id: number;
  name: string;
  age: number;
  occupation: string;
}

const SENTIMENT_VARIANT: Record<string, "success" | "warning" | "destructive" | "muted"> = {
  positive: "success",
  neutral: "muted",
  negative: "destructive",
};

export function ResponsesTable({ simId }: { simId: number }) {
  const [selected, setSelected] = useState<ResponseRow | null>(null);

  const responses = useQuery<ResponseRow[]>({
    queryKey: ["sim-responses", simId],
    queryFn: () => api.get<ResponseRow[]>(`/simulations/${simId}/responses`),
    refetchInterval: (q) => {
      // Stop polling once we likely have results; insights page will trigger reload
      return q.state.data && q.state.data.length > 0 ? false : 2000;
    },
  });

  const personaIds = (responses.data ?? []).map((r) => r.persona_id);
  const personas = useQuery<Record<number, PersonaSummary>>({
    queryKey: ["personas-for-sim", simId, personaIds.length],
    queryFn: async () => {
      const list = await api.get<PersonaSummary[]>(`/personas?limit=500`);
      return Object.fromEntries(list.map((p) => [p.id, p]));
    },
    enabled: personaIds.length > 0,
  });

  const rows = responses.data ?? [];

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Agent responses
            {rows.length > 0 && (
              <span className="text-muted-foreground font-normal text-sm ml-2">
                ({rows.length})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No responses yet. They'll appear as agents finish.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-md border border-border">
              <table className="w-full text-sm">
                <thead className="bg-surface-elevated text-muted-foreground">
                  <tr className="text-left">
                    <th className="px-3 py-2 text-xs font-medium uppercase">Persona</th>
                    <th className="px-3 py-2 text-xs font-medium uppercase text-center">Intent</th>
                    <th className="px-3 py-2 text-xs font-medium uppercase">Sentiment</th>
                    <th className="px-3 py-2 text-xs font-medium uppercase">Top concern</th>
                    <th className="px-3 py-2 text-xs font-medium uppercase">Recommend</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const p = personas.data?.[r.persona_id];
                    return (
                      <tr
                        key={r.id}
                        onClick={() => setSelected(r)}
                        className={cn(
                          "border-t border-border hover:bg-primary/5 cursor-pointer transition-colors",
                          r.failed && "opacity-50"
                        )}
                      >
                        <td className="px-3 py-2.5">
                          {p ? (
                            <>
                              <div className="font-medium">{p.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {p.age}y · {p.occupation}
                              </div>
                            </>
                          ) : (
                            <span className="text-muted-foreground">#{r.persona_id}</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          {r.failed ? (
                            <span className="text-destructive">×</span>
                          ) : (
                            <span className="font-semibold tabular-nums text-primary">
                              {r.purchase_intent}/5
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2.5">
                          {r.failed ? (
                            <Badge variant="destructive" className="text-[10px]">
                              error
                            </Badge>
                          ) : (
                            <Badge
                              variant={SENTIMENT_VARIANT[r.sentiment] ?? "muted"}
                              className="text-[10px] capitalize"
                            >
                              {r.sentiment}
                            </Badge>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-muted-foreground line-clamp-1 max-w-[260px]">
                          {r.failed ? r.error : r.response?.top_concern}
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="capitalize text-xs">
                            {r.response?.would_recommend ?? "—"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent>
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {personas.data?.[selected.persona_id]?.name ?? `Persona #${selected.persona_id}`}
                </DialogTitle>
                <DialogDescription>
                  Purchase intent {selected.purchase_intent}/5 ·{" "}
                  <span className="capitalize">{selected.sentiment}</span> ·{" "}
                  {selected.latency_ms}ms
                </DialogDescription>
              </DialogHeader>
              <Separator />
              {selected.failed ? (
                <div className="text-sm text-destructive">{selected.error}</div>
              ) : (
                <div className="space-y-4 text-sm">
                  <FieldRow label="Top concern" value={selected.response.top_concern} />
                  <FieldRow label="Top positive" value={selected.response.top_positive} />
                  <FieldRow label="Would recommend" value={selected.response.would_recommend} />
                  <FieldRow
                    label="Reasoning"
                    value={selected.response.reasoning}
                    italic
                  />
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function FieldRow({ label, value, italic }: { label: string; value: string; italic?: boolean }) {
  return (
    <div className="space-y-1">
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <p className={cn("text-foreground/90", italic && "italic")}>{value}</p>
    </div>
  );
}
