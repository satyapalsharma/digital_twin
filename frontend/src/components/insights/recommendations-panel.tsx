"use client";

import { Lightbulb } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface Props {
  recommendations: string[];
}

export function RecommendationsPanel({ recommendations }: Props) {
  if (!recommendations || recommendations.length === 0) return null;

  return (
    <Card className="border-primary/30 bg-primary/[0.03]">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Lightbulb className="size-4 text-primary" />
          Recommendations
        </CardTitle>
        <CardDescription>
          LLM-suggested changes to improve this product&apos;s reception.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="space-y-3">
          {recommendations.map((rec, i) => (
            <li key={i} className="flex gap-3 text-sm">
              <span className="size-5 shrink-0 grid place-items-center rounded-full bg-primary/15 text-primary text-xs font-semibold tabular-nums">
                {i + 1}
              </span>
              <span className="leading-relaxed pt-0.5">{rec}</span>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
