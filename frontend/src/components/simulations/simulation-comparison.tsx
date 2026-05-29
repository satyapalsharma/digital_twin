"use client";

import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

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

interface SimDetail {
  id: number;
  name: string;
  mode: string;
  status: string;
}

const COLORS = ["#D97757", "#2D8659", "#D9A441", "#A8A29C"];
const SENTIMENT_COLOR = { positive: "#2D8659", neutral: "#A8A29C", negative: "#C7453C" };

export function SimulationComparison({ simulationIds }: { simulationIds: number[] }) {
  const responseQueries = useQueries({
    queries: simulationIds.map((id) => ({
      queryKey: ["sim-responses-compare", id],
      queryFn: () => api.get<ResponseRow[]>(`/simulations/${id}/responses`),
    })),
  });

  const simQueries = useQueries({
    queries: simulationIds.map((id) => ({
      queryKey: ["simulation-detail", id],
      queryFn: () => api.get<SimDetail>(`/simulations/${id}`),
    })),
  });

  const isLoading = responseQueries.some((q) => q.isLoading) || simQueries.some((q) => q.isLoading);
  const allResponses = responseQueries.map((q) => q.data ?? []);
  const simDetails = simQueries.map((q) => q.data);

  const stats = useMemo(() => {
    return simulationIds.map((id, idx) => {
      const responses = allResponses[idx] || [];
      const successResponses = responses.filter((r) => !r.failed);

      if (successResponses.length === 0) {
        return {
          id,
          name: simDetails[idx]?.name || `Sim ${id}`,
          total: responses.length,
          avgIntent: 0,
          sentiment: { positive: 0, neutral: 0, negative: 0 },
          avgLatency: 0,
          successRate: 0,
        };
      }

      const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
      let totalIntent = 0;
      let totalLatency = 0;

      successResponses.forEach((r) => {
        sentimentCounts[r.sentiment as keyof typeof sentimentCounts]++;
        totalIntent += r.purchase_intent;
        totalLatency += r.latency_ms;
      });

      return {
        id,
        name: simDetails[idx]?.name || `Sim ${id}`,
        total: responses.length,
        avgIntent: (totalIntent / successResponses.length).toFixed(2),
        sentiment: sentimentCounts,
        avgLatency: Math.round(totalLatency / successResponses.length),
        successRate: Math.round((successResponses.length / responses.length) * 100),
      };
    });
  }, [allResponses, simulationIds, simDetails]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-[300px]" />
        ))}
      </div>
    );
  }

  // Prepare data for side-by-side comparisons
  const chartData = stats.map((s) => ({
    name: s.name.slice(0, 15),
    intent: parseFloat(s.avgIntent as string),
    positive: s.sentiment.positive,
    neutral: s.sentiment.neutral,
    negative: s.sentiment.negative,
  }));

  return (
    <div className="space-y-6">
      {/* Summary metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((s) => (
          <Card key={s.id}>
            <CardHeader>
              <CardTitle className="text-base">{s.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">
                  Avg intent
                </div>
                <div className="text-2xl font-bold tabular-nums text-primary">
                  {s.avgIntent}/5
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">
                  Success rate
                </div>
                <div className="text-2xl font-bold tabular-nums">{s.successRate}%</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5">
                  Sentiment
                </div>
                <div className="flex gap-1.5">
                  {(
                    ["positive", "neutral", "negative"] as const
                  ).map((sent) => (
                    <Badge
                      key={sent}
                      variant="outline"
                      className="text-[10px] px-1.5"
                    >
                      {s.sentiment[sent]}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Intent comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Average purchase intent</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8E2DA" />
              <XAxis dataKey="name" stroke="#6B655D" fontSize={12} />
              <YAxis domain={[0, 5]} stroke="#6B655D" fontSize={12} />
              <Tooltip contentStyle={{ borderRadius: 6, border: "1px solid #E8E2DA" }} />
              <Bar dataKey="intent" fill="#D97757" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Sentiment comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sentiment distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 0, right: 30, left: 120, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E8E2DA" />
              <XAxis type="number" stroke="#6B655D" fontSize={12} />
              <YAxis dataKey="name" type="category" stroke="#6B655D" fontSize={12} />
              <Tooltip contentStyle={{ borderRadius: 6, border: "1px solid #E8E2DA" }} />
              <Legend />
              <Bar dataKey="positive" fill={SENTIMENT_COLOR.positive} radius={[0, 4, 4, 0]} />
              <Bar dataKey="neutral" fill={SENTIMENT_COLOR.neutral} radius={[0, 4, 4, 0]} />
              <Bar
                dataKey="negative"
                fill={SENTIMENT_COLOR.negative}
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Responses table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Response count by simulation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-elevated text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase">
                    Simulation
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-medium uppercase">
                    Total
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-medium uppercase">
                    Succeeded
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-medium uppercase">
                    Avg latency
                  </th>
                </tr>
              </thead>
              <tbody>
                {stats.map((s) => {
                  const succeeded = s.total - (allResponses[stats.indexOf(s)] ?? []).filter((r: ResponseRow) => r.failed).length;
                  return (
                    <tr key={s.id} className="border-t border-border">
                      <td className="px-3 py-2">{s.name}</td>
                      <td className="px-3 py-2 text-center font-medium">{s.total}</td>
                      <td className="px-3 py-2 text-center">{succeeded}</td>
                      <td className="px-3 py-2 text-center tabular-nums">
                        {s.avgLatency}ms
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
