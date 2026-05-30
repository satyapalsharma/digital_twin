"use client";

import Link from "next/link";
import { useQueries, useQuery } from "@tanstack/react-query";
import {
  Users,
  Filter,
  Package,
  PlayCircle,
  ArrowRight,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/layout/states";
import { api } from "@/lib/api";
import { formatNumber } from "@/lib/utils";

interface DemoState {
  personas: number;
  audiences: number;
  products: number;
  surveys: number;
  simulations: number;
}

interface SimRow {
  id: number;
  name: string;
  status: string;
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

const VERDICT_LABEL: Record<string, string> = {
  launch: "Launch",
  optimize: "Optimize",
  halt: "Halt",
};

export default function OverviewPage() {
  const stateQ = useQuery({
    queryKey: ["admin-state"],
    queryFn: () => api.get<DemoState>("/admin/state"),
  });

  const simsQ = useQuery({
    queryKey: ["simulations"],
    queryFn: () => api.get<SimRow[]>("/simulations"),
  });

  const completed = (simsQ.data ?? []).filter((s) => s.status === "completed");

  // Pull the verdict for each completed run so we can summarise outcomes.
  const insightQs = useQueries({
    queries: completed.map((s) => ({
      queryKey: ["insight-summary", s.id],
      queryFn: () => api.get<InsightSummary>(`/simulations/${s.id}/insight`),
      retry: 0,
    })),
  });

  const insights = insightQs
    .map((q) => q.data)
    .filter((d): d is InsightSummary => !!d);

  const verdictCounts = insights.reduce<Record<string, number>>((acc, i) => {
    acc[i.verdict] = (acc[i.verdict] ?? 0) + 1;
    return acc;
  }, {});

  const avgConfidence =
    insights.length > 0
      ? Math.round(
          (insights.reduce((sum, i) => sum + i.confidence, 0) / insights.length) *
            100
        )
      : null;

  function insightOf(simId: number): InsightSummary | undefined {
    const idx = completed.findIndex((c) => c.id === simId);
    return idx >= 0 ? insightQs[idx]?.data : undefined;
  }

  // Latest decision = most recent completed run with a synthesised verdict
  // (the simulations list is already ordered newest-first by the API).
  const latest = completed.find((s) => !!insightOf(s.id));

  return (
    <div className="px-6 sm:px-8 py-10 max-w-7xl mx-auto space-y-8">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Decision overview</h1>
        <p className="text-muted-foreground">
          Test any product decision on{" "}
          <span className="font-medium text-foreground">
            {stateQ.data ? formatNumber(stateQ.data.personas) : "thousands of"}
          </span>{" "}
          synthetic customers before a dollar is spent.
        </p>
      </header>

      {/* Headline KPIs */}
      {stateQ.isError ? (
        <ErrorState
          title="Couldn’t load overview metrics"
          onRetry={() => stateQ.refetch()}
        />
      ) : (
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={Users}
          label="Synthetic customers"
          value={stateQ.data?.personas}
          loading={stateQ.isPending}
          href="/personas"
        />
        <KpiCard
          icon={Filter}
          label="Audiences defined"
          value={stateQ.data?.audiences}
          loading={stateQ.isPending}
          href="/audiences"
        />
        <KpiCard
          icon={Package}
          label="Product plays"
          value={stateQ.data?.products}
          loading={stateQ.isPending}
          href="/products"
        />
        <KpiCard
          icon={PlayCircle}
          label="Decisions simulated"
          value={stateQ.data?.simulations}
          loading={stateQ.isPending}
          href="/simulations"
        />
      </section>
      )}

      {/* Decision outcomes + latest verdict */}
      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Decision outcomes
              </h2>
              {avgConfidence !== null && (
                <span className="text-xs text-muted-foreground">
                  avg. confidence{" "}
                  <span className="font-semibold text-foreground tabular-nums">
                    {avgConfidence}%
                  </span>
                </span>
              )}
            </div>

            {simsQ.isError ? (
              <p className="text-sm text-destructive py-4">
                Couldn’t load simulation outcomes.
              </p>
            ) : simsQ.isPending ? (
              <Skeleton className="h-20" />
            ) : insights.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">
                No synthesised verdicts yet. Run a simulation to land your first
                Launch · Optimize · Halt decision.
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {(["launch", "optimize", "halt"] as const).map((v) => (
                  <div
                    key={v}
                    className="rounded-lg border border-border bg-surface-elevated/40 p-4 text-center"
                  >
                    <p className="text-3xl font-bold tabular-nums">
                      {verdictCounts[v] ?? 0}
                    </p>
                    <Badge variant={VERDICT_VARIANT[v]} className="mt-2 text-[10px] uppercase">
                      {VERDICT_LABEL[v]}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Latest decision highlight */}
        <Card>
          <CardContent className="p-6 space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Latest decision
            </h2>
            {latest ? (
              <Link
                href={`/insights/${latest.id}`}
                aria-label={`Open insights for ${latest.name}`}
                className="block rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 group"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-success shrink-0" aria-hidden />
                  <span className="font-medium truncate group-hover:text-primary transition-colors">
                    {latest.name}
                  </span>
                </div>
                {(() => {
                  const ins = insightOf(latest.id);
                  if (!ins) return null;
                  return (
                    <>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant={VERDICT_VARIANT[ins.verdict]} className="text-[10px] uppercase">
                          {VERDICT_LABEL[ins.verdict] ?? ins.verdict}
                        </Badge>
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {Math.round(ins.confidence * 100)}% confidence
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-3">
                        {ins.summary}
                      </p>
                    </>
                  );
                })()}
                <span className="inline-flex items-center gap-1 text-xs text-primary mt-3">
                  View full dashboard
                  <ArrowRight className="size-3.5" aria-hidden />
                </span>
              </Link>
            ) : (
              <p className="text-sm text-muted-foreground">
                No completed runs yet.
              </p>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Primary CTA — the golden path */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="size-9 shrink-0 grid place-items-center rounded-lg bg-primary/15 text-primary">
              <Sparkles className="size-5" aria-hidden />
            </span>
            <div>
              <h3 className="font-semibold">Run a decision</h3>
              <p className="text-sm text-muted-foreground">
                Pick an audience and a product play, then simulate the reaction.
              </p>
            </div>
          </div>
          <Button asChild className="shrink-0">
            <Link href="/simulations">
              Start a simulation
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  loading,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value?: number;
  loading: boolean;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <Card className="hover:border-primary/40 hover:shadow-sm transition-all h-full">
        <CardContent className="p-5 space-y-3">
          <span className="size-9 grid place-items-center rounded-lg bg-primary/10 text-primary">
            <Icon className="size-5" />
          </span>
          {loading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <p className="text-3xl font-bold tabular-nums leading-none">
              {value !== undefined ? formatNumber(value) : "—"}
            </p>
          )}
          <p className="text-sm text-muted-foreground">{label}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
