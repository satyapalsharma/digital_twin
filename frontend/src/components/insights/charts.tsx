"use client";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PRIMARY = "#D97757";
const SUCCESS = "#2D8659";
const WARNING = "#D9A441";
const DESTRUCTIVE = "#C7453C";
const MUTED = "#A8A29C";

interface SentimentProps {
  positive: number;
  neutral: number;
  negative: number;
}

export function SentimentDonut({ positive, neutral, negative }: SentimentProps) {
  const data = [
    { name: "Positive", value: positive, color: SUCCESS },
    { name: "Neutral", value: neutral, color: MUTED },
    { name: "Negative", value: negative, color: DESTRUCTIVE },
  ];
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Sentiment breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              label={(d) => `${d.value}%`}
            >
              {data.map((d) => (
                <Cell key={d.name} fill={d.color} stroke="none" />
              ))}
            </Pie>
            <Tooltip
              formatter={(v, n) => [`${v as number}%`, n as string]}
              contentStyle={{ borderRadius: 6, border: "1px solid #E8E2DA" }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex justify-center gap-4 text-xs mt-2">
          {data.map((d) => (
            <div key={d.name} className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm" style={{ background: d.color }} />
              <span>{d.name}: {d.value}%</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface IntentProps {
  distribution: number[];
  average: number;
}

export function IntentDistribution({ distribution, average }: IntentProps) {
  const data = distribution.map((count, i) => ({
    intent: `${i + 1}`,
    count,
  }));
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Purchase intent distribution
          <span className="text-muted-foreground font-normal text-sm ml-2">
            avg {average} / 5
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E8E2DA" />
            <XAxis dataKey="intent" stroke="#6B655D" fontSize={12} />
            <YAxis stroke="#6B655D" fontSize={12} allowDecimals={false} />
            <Tooltip
              cursor={{ fill: "rgba(217, 119, 87, 0.08)" }}
              contentStyle={{ borderRadius: 6, border: "1px solid #E8E2DA" }}
            />
            <Bar dataKey="count" fill={PRIMARY} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <p className="text-xs text-muted-foreground text-center mt-2">
          1 = won't take · 5 = very likely to take
        </p>
      </CardContent>
    </Card>
  );
}

interface RecommendProps {
  yes: number;
  no: number;
  maybe: number;
}

export function RecommendBar({ yes, no, maybe }: RecommendProps) {
  const data = [
    { name: "Recommend", yes, maybe, no },
  ];
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Would they recommend it?</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={data} layout="vertical" margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
            <XAxis type="number" hide domain={[0, 100]} />
            <YAxis type="category" hide />
            <Tooltip
              formatter={(v) => [`${v as number}%`]}
              contentStyle={{ borderRadius: 6, border: "1px solid #E8E2DA" }}
            />
            <Bar dataKey="yes" stackId="a" fill={SUCCESS} radius={[4, 0, 0, 4]} />
            <Bar dataKey="maybe" stackId="a" fill={WARNING} />
            <Bar dataKey="no" stackId="a" fill={DESTRUCTIVE} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="flex justify-center gap-4 text-xs">
          <Legend color={SUCCESS} label={`Yes: ${yes}%`} />
          <Legend color={WARNING} label={`Maybe: ${maybe}%`} />
          <Legend color={DESTRUCTIVE} label={`No: ${no}%`} />
        </div>
      </CardContent>
    </Card>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="size-2.5 rounded-sm" style={{ background: color }} />
      <span>{label}</span>
    </div>
  );
}
