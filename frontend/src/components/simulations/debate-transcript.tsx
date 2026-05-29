"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { PersonaAvatar } from "@/components/personas/avatar";

interface ResponseRow {
  id: number;
  persona_id: number;
  response: {
    round: number;
    message: string;
    stance: string;
    decision?: string;
    speaker_name?: string;
  };
  sentiment: string;
  purchase_intent: number;
  failed: boolean;
  error?: string | null;
  created_at?: string;
}

interface DebateTranscriptProps {
  simId: number;
  status: string;
  totalExpected?: number;
}

const STANCE_VARIANT: Record<string, "success" | "warning" | "destructive" | "muted"> = {
  supportive: "success",
  skeptical: "destructive",
  curious: "warning",
  conflicted: "warning",
  neutral: "muted",
};

const SENTIMENT_VARIANT: Record<string, "success" | "warning" | "destructive" | "muted"> = {
  positive: "success",
  neutral: "muted",
  negative: "destructive",
};


export function DebateTranscript({ simId, status, totalExpected = 15 }: DebateTranscriptProps) {
  const responses = useQuery<ResponseRow[]>({
    queryKey: ["sim-responses", simId],
    queryFn: () => api.get<ResponseRow[]>(`/simulations/${simId}/responses`),
    refetchInterval: status === "completed" || status === "failed" ? false : 1500,
  });

  const rows = responses.data ?? [];
  const byRound = useMemo(() => {
    const m: Record<number, ResponseRow[]> = { 1: [], 2: [], 3: [] };
    for (const r of rows) {
      const rd = r.response?.round ?? 1;
      (m[rd] ??= []).push(r);
    }
    return m;
  }, [rows]);

  const isRunning = status === "running" || status === "pending";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="size-4 text-primary" />
          <CardTitle className="text-base">Focus group transcript</CardTitle>
        </div>
        <Badge variant="outline" className="text-[10px] tabular-nums">
          {rows.length} / {totalExpected} turns
        </Badge>
      </CardHeader>
      <CardContent className="space-y-8">
        {[1, 2, 3].map((rd) => {
          const turns = byRound[rd] ?? [];
          if (turns.length === 0 && !isRunning && rows.length === 0) return null;
          if (turns.length === 0 && !isRunning) return null;
          return (
            <RoundSection
              key={rd}
              round={rd}
              turns={turns}
              isPending={isRunning && turns.length === 0}
              isInProgress={isRunning && turns.length > 0 && rd < 3}
            />
          );
        })}

        {rows.length === 0 && (
          <div className="text-center py-12 space-y-2">
            <Loader2 className="size-6 mx-auto text-muted-foreground animate-spin" />
            <p className="text-sm text-muted-foreground">
              Spinning up the focus group...
            </p>
          </div>
        )}

        {status === "completed" && byRound[3] && byRound[3].length > 0 && (
          <FinalTally turns={byRound[3]} />
        )}
      </CardContent>
    </Card>
  );
}

function RoundSection({
  round,
  turns,
  isPending,
  isInProgress,
}: {
  round: number;
  turns: ResponseRow[];
  isPending: boolean;
  isInProgress: boolean;
}) {
  const title =
    round === 1 ? "Round 1 · Opening reactions"
    : round === 2 ? "Round 2 · Cross-talk"
    : "Round 3 · Final positions";

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </h3>
        <div className="flex-1 h-px bg-border" />
        {(isPending || isInProgress) && (
          <Loader2 className="size-3 text-muted-foreground animate-spin" />
        )}
      </div>
      {isPending && (
        <div className="text-xs text-muted-foreground italic pl-1">
          Waiting for personas to respond...
        </div>
      )}
      <div className="space-y-3">
        {turns.map((t) => (
          <TurnBubble key={t.id} turn={t} />
        ))}
      </div>
    </section>
  );
}

function TurnBubble({ turn }: { turn: ResponseRow }) {
  const name = turn.response?.speaker_name ?? `Persona #${turn.persona_id}`;

  return (
    <div className="flex gap-3 group">
      <PersonaAvatar id={turn.persona_id} name={name} size="md" ring />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-1 flex-wrap">
          <span className="text-sm font-semibold">{name}</span>
          {turn.response?.stance && (
            <Badge variant={STANCE_VARIANT[turn.response.stance] ?? "muted"} className="text-[10px] capitalize">
              {turn.response.stance}
            </Badge>
          )}
          {turn.sentiment && turn.sentiment !== "neutral" && (
            <Badge variant={SENTIMENT_VARIANT[turn.sentiment]} className="text-[10px] capitalize">
              {turn.sentiment}
            </Badge>
          )}
          {turn.response?.decision && (
            <Badge
              variant={
                turn.response.decision === "yes" ? "success"
                : turn.response.decision === "no" ? "destructive"
                : "warning"
              }
              className="text-[10px] uppercase"
            >
              {turn.response.decision === "yes" ? "Would buy" : turn.response.decision === "no" ? "Won't buy" : "Maybe"}
            </Badge>
          )}
        </div>
        <div
          className={cn(
            "rounded-lg px-4 py-3 text-sm leading-relaxed",
            turn.failed
              ? "bg-destructive/5 border border-destructive/20 text-destructive italic"
              : "bg-surface-elevated border border-border"
          )}
        >
          {turn.failed ? (
            <>
              <XCircle className="size-3 inline mr-1" />
              {turn.error ?? "Failed to respond"}
            </>
          ) : (
            turn.response?.message
          )}
        </div>
      </div>
    </div>
  );
}

function FinalTally({ turns }: { turns: ResponseRow[] }) {
  const counts = { yes: 0, no: 0, maybe: 0 };
  let totalIntent = 0;
  let intentN = 0;
  for (const t of turns) {
    const d = t.response?.decision;
    if (d === "yes") counts.yes++;
    else if (d === "no") counts.no++;
    else counts.maybe++;
    if (t.purchase_intent > 0) {
      totalIntent += t.purchase_intent;
      intentN++;
    }
  }
  const total = turns.length;
  const avgIntent = intentN > 0 ? (totalIntent / intentN).toFixed(1) : "—";

  return (
    <div className="mt-4 pt-6 border-t border-border space-y-3">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="size-4 text-success" />
        <h3 className="text-sm font-semibold">Final tally</h3>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <TallyChip label="Would buy" value={counts.yes} total={total} variant="success" />
        <TallyChip label="Maybe" value={counts.maybe} total={total} variant="warning" />
        <TallyChip label="Wouldn't buy" value={counts.no} total={total} variant="destructive" />
        <TallyChip label="Avg intent" value={avgIntent} total={5} variant="muted" suffix="/ 5" />
      </div>
    </div>
  );
}

function TallyChip({
  label,
  value,
  total,
  variant,
  suffix,
}: {
  label: string;
  value: number | string;
  total: number;
  variant: "success" | "warning" | "destructive" | "muted";
  suffix?: string;
}) {
  const text = {
    success: "text-success",
    warning: "text-warning",
    destructive: "text-destructive",
    muted: "text-foreground",
  }[variant];
  return (
    <Card className="bg-surface-elevated border-0">
      <CardContent className="p-3 text-center">
        <div className={cn("text-2xl font-bold tabular-nums", text)}>
          {value}
          {suffix && <span className="text-xs text-muted-foreground font-normal ml-1">{suffix}</span>}
          {!suffix && typeof value === "number" && (
            <span className="text-xs text-muted-foreground font-normal ml-1">/ {total}</span>
          )}
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
      </CardContent>
    </Card>
  );
}
