"use client";

import {
  DollarSign,
  Gauge,
  Timer,
  Coins,
  CheckCircle2,
  Activity,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNumber } from "@/lib/utils";

export interface Telemetry {
  tokens_in: number;
  tokens_out: number;
  total_tokens: number;
  avg_tokens_per_response: number;
  avg_latency_ms: number;
  p95_latency_ms: number;
  est_cost_usd: number;
  completion_rate_pct: number;
}

function fmtMs(ms: number) {
  if (!ms) return "—";
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`;
}

export function TelemetryPanel({ telemetry: t }: { telemetry?: Telemetry }) {
  if (!t || t.total_tokens === 0) return null;

  const items = [
    {
      icon: DollarSign,
      label: "Est. cost",
      value: `$${t.est_cost_usd.toFixed(4)}`,
      sub: "this run",
    },
    {
      icon: CheckCircle2,
      label: "Completion rate",
      value: `${t.completion_rate_pct}%`,
      sub: "agents that responded",
    },
    {
      icon: Timer,
      label: "Avg latency",
      value: fmtMs(t.avg_latency_ms),
      sub: "per agent call",
    },
    {
      icon: Gauge,
      label: "p95 latency",
      value: fmtMs(t.p95_latency_ms),
      sub: "tail latency",
    },
    {
      icon: Coins,
      label: "Total tokens",
      value: formatNumber(t.total_tokens),
      sub: `${formatNumber(t.tokens_in)} in · ${formatNumber(t.tokens_out)} out`,
    },
    {
      icon: Activity,
      label: "Tokens / response",
      value: formatNumber(Math.round(t.avg_tokens_per_response)),
      sub: "average",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Run telemetry
          <span className="text-muted-foreground font-normal text-sm ml-2">
            cost &amp; performance
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="rounded-md border border-border p-3 bg-surface-elevated/50"
              >
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Icon className="size-3.5" />
                  <span className="text-[11px]">{item.label}</span>
                </div>
                <div className="text-xl font-bold mt-1 tabular-nums">
                  {item.value}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
                  {item.sub}
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-[11px] text-muted-foreground mt-3">
          Cost is estimated from token usage at approximate model rates.
        </p>
      </CardContent>
    </Card>
  );
}
