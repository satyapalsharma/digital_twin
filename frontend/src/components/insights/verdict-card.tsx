"use client";

import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const VERDICT_CONFIG = {
  launch: {
    label: "Launch",
    icon: CheckCircle2,
    bg: "bg-success/10",
    border: "border-success/30",
    text: "text-success",
    ring: "ring-success/20",
  },
  optimize: {
    label: "Optimize",
    icon: AlertTriangle,
    bg: "bg-warning/10",
    border: "border-warning/30",
    text: "text-warning",
    ring: "ring-warning/20",
  },
  halt: {
    label: "Halt",
    icon: XCircle,
    bg: "bg-destructive/10",
    border: "border-destructive/30",
    text: "text-destructive",
    ring: "ring-destructive/20",
  },
} as const;

interface Props {
  verdict: "launch" | "optimize" | "halt";
  confidence: number;
  summary: string;
  reasoning: string;
}

export function VerdictCard({ verdict, confidence, summary, reasoning }: Props) {
  const c = VERDICT_CONFIG[verdict];
  const Icon = c.icon;
  const confPct = Math.round(confidence * 100);

  return (
    <Card className={cn("border-2", c.border, c.bg)}>
      <CardContent className="p-8">
        <div className="flex flex-col md:flex-row gap-6 md:items-center">
          <div className={cn(
            "size-24 rounded-2xl grid place-items-center shrink-0 shadow-sm bg-surface ring-4",
            c.ring
          )}>
            <Icon className={cn("size-12", c.text)} />
          </div>
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className={cn("text-4xl font-bold tracking-tight uppercase", c.text)}>
                {c.label}
              </h2>
              <Badge variant="outline" className="text-sm py-1 px-3 tabular-nums">
                {confPct}% confidence
              </Badge>
            </div>
            <p className="text-lg font-medium leading-snug">{summary}</p>
            <p className="text-sm text-foreground/80 leading-relaxed">{reasoning}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
