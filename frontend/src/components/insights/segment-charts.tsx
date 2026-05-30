"use client";

import { useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  LabelList,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  PRIMARY,
  SUCCESS,
  WARNING,
  DESTRUCTIVE,
  MUTED,
  BORDER,
  AXIS,
  TOOLTIP_STYLE,
} from "./palette";

export interface SegmentRow {
  segment: string;
  count: number;
  avg_intent: number;
  positive_pct: number;
  negative_pct: number;
}

interface Dimension {
  key: string;
  label: string;
  rows: SegmentRow[];
}

function intentColor(value: number, overall: number) {
  if (value >= overall + 0.3) return SUCCESS;
  if (value <= overall - 0.3) return DESTRUCTIVE;
  return WARNING;
}

function prettySegment(s: string) {
  return s.replace(/_/g, " ");
}

export function SegmentExplorer({
  overallAvg,
  byRisk,
  byAge,
  byIncome,
  byRegion,
}: {
  overallAvg: number;
  byRisk: SegmentRow[];
  byAge: SegmentRow[];
  byIncome: SegmentRow[];
  byRegion: SegmentRow[];
}) {
  const dimensions: Dimension[] = [
    { key: "age", label: "Age", rows: byAge },
    { key: "risk", label: "Risk tolerance", rows: byRisk },
    { key: "income", label: "Income", rows: byIncome },
    { key: "region", label: "Region", rows: byRegion },
  ].filter((d) => d.rows && d.rows.length > 0);

  const [active, setActive] = useState(dimensions[0]?.key ?? "age");
  const dim = dimensions.find((d) => d.key === active) ?? dimensions[0];

  if (!dim) return null;

  // Tallest chart wins; ~34px per row keeps bars readable.
  const chartHeight = Math.max(180, dim.rows.length * 38 + 40);

  const sentimentData = dim.rows.map((r) => ({
    segment: prettySegment(r.segment),
    positive: r.positive_pct,
    negative: r.negative_pct,
    neutral: Math.max(0, Math.round((100 - r.positive_pct - r.negative_pct) * 10) / 10),
  }));

  const intentData = dim.rows.map((r) => ({
    segment: prettySegment(r.segment),
    avg_intent: r.avg_intent,
    count: r.count,
  }));

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 gap-3 flex-wrap">
        <div>
          <CardTitle className="text-base">Segment analysis</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Slice purchase intent and sentiment across customer dimensions.
          </p>
        </div>
        <div className="inline-flex rounded-md border border-border p-0.5 bg-surface text-xs">
          {dimensions.map((d) => (
            <button
              key={d.key}
              type="button"
              onClick={() => setActive(d.key)}
              className={cn(
                "px-2.5 py-1 rounded-[5px] transition-colors cursor-pointer",
                active === d.key
                  ? "bg-primary/15 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {d.label}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Avg purchase intent by segment */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Avg purchase intent (of 5)
          </h4>
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart
              data={intentData}
              layout="vertical"
              margin={{ top: 4, right: 28, left: 4, bottom: 4 }}
            >
              <CartesianGrid horizontal={false} stroke={BORDER} strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 5]} stroke={AXIS} fontSize={11} />
              <YAxis
                type="category"
                dataKey="segment"
                stroke={AXIS}
                fontSize={11}
                width={86}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: "rgba(217, 119, 87, 0.08)" }}
                contentStyle={TOOLTIP_STYLE}
                formatter={(v, _n, p) => [
                  `${v as number} / 5  ·  n=${(p?.payload as { count: number })?.count}`,
                  "Avg intent",
                ]}
              />
              <ReferenceLine
                x={overallAvg}
                stroke={PRIMARY}
                strokeDasharray="4 3"
                label={{
                  value: `overall ${overallAvg}`,
                  position: "top",
                  fill: PRIMARY,
                  fontSize: 10,
                }}
              />
              <Bar dataKey="avg_intent" radius={[0, 4, 4, 0]} barSize={20}>
                {intentData.map((d) => (
                  <Cell key={d.segment} fill={intentColor(d.avg_intent, overallAvg)} />
                ))}
                <LabelList
                  dataKey="avg_intent"
                  position="right"
                  fontSize={11}
                  fill={AXIS}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Sentiment mix by segment (100% stacked) */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Sentiment mix
          </h4>
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart
              data={sentimentData}
              layout="vertical"
              stackOffset="expand"
              margin={{ top: 4, right: 12, left: 4, bottom: 4 }}
            >
              <XAxis type="number" hide domain={[0, 1]} />
              <YAxis
                type="category"
                dataKey="segment"
                stroke={AXIS}
                fontSize={11}
                width={86}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: "rgba(217, 119, 87, 0.08)" }}
                contentStyle={TOOLTIP_STYLE}
                formatter={(v, n) => [`${v as number}%`, n as string]}
              />
              <Bar dataKey="positive" stackId="s" fill={SUCCESS} name="Positive" radius={[4, 0, 0, 4]} barSize={20} />
              <Bar dataKey="neutral" stackId="s" fill={MUTED} name="Neutral" barSize={20} />
              <Bar dataKey="negative" stackId="s" fill={DESTRUCTIVE} name="Negative" radius={[0, 4, 4, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 text-xs mt-1">
            <Legend color={SUCCESS} label="Positive" />
            <Legend color={MUTED} label="Neutral" />
            <Legend color={DESTRUCTIVE} label="Negative" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="size-2.5 rounded-sm" style={{ background: color }} />
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}
