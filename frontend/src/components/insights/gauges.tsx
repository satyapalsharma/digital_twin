"use client";

import {
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SUCCESS, WARNING, DESTRUCTIVE, PRIMARY, BORDER } from "./palette";

function RadialGauge({
  value,
  min,
  max,
  color,
  children,
}: {
  value: number;
  min: number;
  max: number;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={170}>
        <RadialBarChart
          innerRadius="68%"
          outerRadius="100%"
          data={[{ name: "v", value }]}
          startAngle={210}
          endAngle={-30}
        >
          <PolarAngleAxis
            type="number"
            domain={[min, max]}
            angleAxisId={0}
            tick={false}
          />
          <RadialBar
            background={{ fill: BORDER }}
            dataKey="value"
            cornerRadius={10}
            fill={color}
            angleAxisId={0}
          />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        {children}
      </div>
    </div>
  );
}

export function ConfidenceGauge({ confidence }: { confidence: number }) {
  const pct = Math.round(confidence * 100);
  const color = pct >= 75 ? SUCCESS : pct >= 50 ? WARNING : DESTRUCTIVE;
  const band = pct >= 75 ? "High confidence" : pct >= 50 ? "Moderate" : "Low confidence";
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Verdict confidence</CardTitle>
      </CardHeader>
      <CardContent>
        <RadialGauge value={pct} min={0} max={100} color={color}>
          <span className="text-4xl font-bold tabular-nums">{pct}%</span>
          <span className="text-xs text-muted-foreground mt-0.5">{band}</span>
        </RadialGauge>
        <p className="text-xs text-muted-foreground text-center mt-1">
          How strongly the data supports this verdict
        </p>
      </CardContent>
    </Card>
  );
}

export function AdvocacyGauge({
  yes,
  no,
}: {
  yes: number;
  no: number;
}) {
  // Net Promoter style: promoters − detractors, range −100…100.
  const nps = Math.round(yes - no);
  const color = nps >= 30 ? SUCCESS : nps >= 0 ? WARNING : DESTRUCTIVE;
  const band =
    nps >= 50 ? "Excellent" : nps >= 30 ? "Strong" : nps >= 0 ? "Mixed" : "Negative";
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Advocacy score
          <span className="text-muted-foreground font-normal text-sm ml-2">
            NPS-style
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <RadialGauge value={nps} min={-100} max={100} color={color}>
          <span className="text-4xl font-bold tabular-nums">
            {nps > 0 ? `+${nps}` : nps}
          </span>
          <span className="text-xs text-muted-foreground mt-0.5">{band}</span>
        </RadialGauge>
        <p className="text-xs text-muted-foreground text-center mt-1">
          {yes}% would recommend · {no}% would not
        </p>
      </CardContent>
    </Card>
  );
}
