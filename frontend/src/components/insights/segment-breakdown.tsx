"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Segment {
  segment: string;
  verdict_lean?: string;
  note?: string;
  count?: number;
  avg_intent?: number;
  positive_pct?: number;
  negative_pct?: number;
}

interface Props {
  fromLLM: Segment[];
  byRisk: Segment[];
  byAge: Segment[];
}

const LEAN_VARIANT: Record<string, "success" | "warning" | "destructive" | "muted"> = {
  launch: "success",
  optimize: "warning",
  halt: "destructive",
};

export function SegmentBreakdown({ fromLLM, byRisk, byAge }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Segment breakdown</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {fromLLM.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              By cohort
            </h3>
            <div className="space-y-2">
              {fromLLM.map((s, i) => (
                <div key={i} className="rounded-md border border-border p-3 text-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">{s.segment}</span>
                    {s.verdict_lean && (
                      <Badge
                        variant={LEAN_VARIANT[s.verdict_lean] ?? "muted"}
                        className="text-[10px] capitalize"
                      >
                        leans {s.verdict_lean}
                      </Badge>
                    )}
                  </div>
                  {s.note && <p className="text-muted-foreground text-xs">{s.note}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DataTable title="By risk tolerance" rows={byRisk} />
          <DataTable title="By age bucket" rows={byAge} />
        </div>
      </CardContent>
    </Card>
  );
}

function DataTable({ title, rows }: { title: string; rows: Segment[] }) {
  if (rows.length === 0) return null;
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      <div className="rounded-md border border-border overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-surface-elevated text-muted-foreground">
            <tr>
              <th className="px-2 py-1.5 text-left">Segment</th>
              <th className="px-2 py-1.5 text-right">N</th>
              <th className="px-2 py-1.5 text-right">Intent</th>
              <th className="px-2 py-1.5 text-right">+/−</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.segment} className="border-t border-border">
                <td className="px-2 py-1.5 capitalize">{r.segment.replace(/_/g, " ")}</td>
                <td className="px-2 py-1.5 text-right tabular-nums">{r.count ?? "—"}</td>
                <td className="px-2 py-1.5 text-right tabular-nums">{r.avg_intent ?? "—"}</td>
                <td className="px-2 py-1.5 text-right tabular-nums">
                  <span className={cn("text-success", (r.positive_pct ?? 0) < 30 && "text-muted-foreground")}>
                    {r.positive_pct ?? 0}%
                  </span>
                  {" / "}
                  <span className={cn("text-destructive", (r.negative_pct ?? 0) < 20 && "text-muted-foreground")}>
                    {r.negative_pct ?? 0}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
