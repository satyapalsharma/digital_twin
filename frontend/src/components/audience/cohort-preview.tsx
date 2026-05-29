"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { Loader2, Users } from "lucide-react";

interface SamplePersona {
  id: number;
  name: string;
  age: number;
  occupation: string;
  income: number;
  region: string;
  risk_tolerance: string;
}

interface Props {
  total: number | undefined;
  sample: SamplePersona[];
  loading: boolean;
}

export function CohortPreview({ total, sample, loading }: Props) {
  return (
    <Card className="sticky top-6 h-fit">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">Cohort preview</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Live count updates as you tune filters
            </p>
          </div>
          {loading && (
            <Loader2 className="size-4 text-muted-foreground animate-spin" />
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-bold tabular-nums text-primary">
              {total !== undefined ? formatNumber(total) : "—"}
            </span>
            <span className="text-sm text-muted-foreground">personas match</span>
          </div>
          {total !== undefined && total === 0 && (
            <p className="text-xs text-warning mt-2">
              Loosen filters or seed more personas
            </p>
          )}
        </div>

        {sample.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider">
              <Users className="size-3" />
              Sample
            </div>
            <div className="space-y-2">
              {sample.map((p) => (
                <div
                  key={p.id}
                  className="rounded-md border border-border bg-surface-elevated/40 px-3 py-2 text-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{p.name}</span>
                    <Badge variant="muted" className="text-[10px]">
                      {p.risk_tolerance}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {p.age}y · {p.occupation} · {formatCurrency(p.income)} · {p.region}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
