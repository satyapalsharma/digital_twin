"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useSimStream } from "@/hooks/use-sim-stream";

interface Props {
  simId: number;
  initialStatus: string;
  totalExpected?: number;
}

export function LiveProgress({ simId, initialStatus, totalExpected }: Props) {
  const stream = useSimStream(simId, initialStatus);
  const qc = useQueryClient();

  // When complete, invalidate the responses query so the table refreshes
  useEffect(() => {
    if (stream.status === "completed" || stream.status === "failed") {
      qc.invalidateQueries({ queryKey: ["sim-responses", simId] });
      qc.invalidateQueries({ queryKey: ["simulation", simId] });
    }
  }, [stream.status, simId, qc]);

  const pct = Math.round(stream.progress * 100);

  return (
    <Card>
      <CardContent className="p-6 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {stream.status === "running" && (
              <>
                <Loader2 className="size-4 text-warning animate-spin" />
                <span className="font-medium">Running simulation</span>
              </>
            )}
            {stream.status === "completed" && (
              <>
                <CheckCircle2 className="size-4 text-success" />
                <span className="font-medium">Simulation complete</span>
              </>
            )}
            {stream.status === "failed" && (
              <>
                <AlertCircle className="size-4 text-destructive" />
                <span className="font-medium">Simulation failed</span>
              </>
            )}
            {stream.status === "pending" && <span className="font-medium">Starting...</span>}
          </div>
          <Badge variant="outline" className="tabular-nums">
            {stream.responses}
            {totalExpected ? ` / ${totalExpected}` : ""} responses
          </Badge>
        </div>

        <Progress value={pct} />

        <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
          <span>{pct}%</span>
          <span>
            {stream.connected
              ? "live stream connected"
              : stream.status === "completed"
              ? "stream closed"
              : "reconnecting..."}
          </span>
        </div>

        {stream.error && (
          <p className="text-xs text-destructive">{stream.error}</p>
        )}
      </CardContent>
    </Card>
  );
}
