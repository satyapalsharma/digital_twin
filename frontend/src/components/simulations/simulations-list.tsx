"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, CheckCircle2, Circle, AlertCircle, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

interface SimRow {
  id: number;
  name: string;
  mode: string;
  status: string;
  progress: number;
  audience_id: number;
  product_id: number;
  created_at: string;
}

const STATUS_VARIANT: Record<string, "success" | "warning" | "destructive" | "muted"> = {
  completed: "success",
  running: "warning",
  failed: "destructive",
  pending: "muted",
};

const StatusIcon = ({ status }: { status: string }) => {
  if (status === "completed") return <CheckCircle2 className="size-4 text-success" />;
  if (status === "running") return <Loader2 className="size-4 text-warning animate-spin" />;
  if (status === "failed") return <AlertCircle className="size-4 text-destructive" />;
  return <Circle className="size-4 text-muted-foreground" />;
};

export function SimulationsList() {
  const { data, isLoading } = useQuery<SimRow[]>({
    queryKey: ["simulations"],
    queryFn: () => api.get<SimRow[]>("/simulations"),
    refetchInterval: 3000,
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[0, 1].map((i) => (
          <Skeleton key={i} className="h-[68px]" />
        ))}
      </div>
    );
  }
  const sims = data ?? [];

  if (sims.length === 0) {
    return (
      <Card className="border-dashed bg-surface-elevated/30">
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          No simulations yet. Start your first one above.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {sims.map((s) => (
        <Link key={s.id} href={`/simulations/${s.id}`}>
          <Card className="hover:border-primary/40 hover:shadow-sm transition-all cursor-pointer">
            <CardContent className="p-4 flex items-center gap-4">
              <StatusIcon status={s.status} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium truncate">{s.name}</h4>
                  <Badge variant={STATUS_VARIANT[s.status] ?? "muted"} className="text-[10px]">
                    {s.status}
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">
                    {s.mode}
                  </Badge>
                </div>
                {s.status === "running" && (
                  <Progress value={Math.round(s.progress * 100)} className="mt-2" />
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(s.created_at).toLocaleString()}
                </p>
              </div>
              <ArrowRight className="size-4 text-muted-foreground shrink-0" />
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
