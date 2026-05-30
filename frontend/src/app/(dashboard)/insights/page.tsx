"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, LineChart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ErrorState } from "@/components/layout/states";
import { api } from "@/lib/api";

interface SimRow {
  id: number;
  name: string;
  mode: string;
  status: string;
  product_id: number;
  audience_id: number;
  created_at: string;
}

interface InsightSummary {
  verdict: string;
  confidence: number;
  summary: string;
}

const VERDICT_VARIANT: Record<string, "success" | "warning" | "destructive"> = {
  launch: "success",
  optimize: "warning",
  halt: "destructive",
};

export default function InsightsPage() {
  const sims = useQuery<SimRow[]>({
    queryKey: ["simulations"],
    queryFn: () => api.get<SimRow[]>("/simulations"),
  });

  const completed = (sims.data ?? []).filter((s) => s.status === "completed");

  return (
    <div className="px-8 py-10 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Insights</h1>
        <p className="text-muted-foreground mt-1">
          Verdicts for completed simulations. Click a run to see the full dashboard.
        </p>
      </div>

      {sims.isError ? (
        <ErrorState
          title="Couldn’t load simulations"
          onRetry={() => sims.refetch()}
        />
      ) : completed.length === 0 ? (
        <Card className="border-dashed bg-surface-elevated/30">
          <CardContent className="py-12 text-center space-y-2">
            <LineChart className="size-8 mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No completed simulations yet. Run one at{" "}
              <Link href="/simulations" className="text-primary underline">
                /simulations
              </Link>
              .
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {completed.map((s) => (
            <InsightRow key={s.id} sim={s} />
          ))}
        </div>
      )}
    </div>
  );
}

function InsightRow({ sim }: { sim: SimRow }) {
  const insight = useQuery<InsightSummary>({
    queryKey: ["insight-summary", sim.id],
    queryFn: () => api.get<InsightSummary>(`/simulations/${sim.id}/insight`),
    retry: 0,
  });

  return (
    <Link
      href={`/insights/${sim.id}`}
      aria-label={`Open insights for ${sim.name}`}
      className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <Card className="hover:border-primary/40 hover:shadow-sm transition-all cursor-pointer">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-medium truncate">{sim.name}</h4>
              {insight.data ? (
                <>
                  <Badge variant={VERDICT_VARIANT[insight.data.verdict]} className="text-[10px] uppercase">
                    {insight.data.verdict}
                  </Badge>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {Math.round(insight.data.confidence * 100)}%
                  </span>
                </>
              ) : (
                <Badge variant="muted" className="text-[10px]">
                  pending synthesis
                </Badge>
              )}
            </div>
            {insight.data && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                {insight.data.summary}
              </p>
            )}
          </div>
          <ArrowRight className="size-4 text-muted-foreground shrink-0" />
        </CardContent>
      </Card>
    </Link>
  );
}
