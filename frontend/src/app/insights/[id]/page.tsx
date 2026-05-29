"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/lib/api";
import { VerdictCard } from "@/components/insights/verdict-card";
import {
  SentimentDonut,
  IntentDistribution,
  RecommendBar,
} from "@/components/insights/charts";
import { ConcernsLists } from "@/components/insights/concerns-lists";
import { SegmentBreakdown } from "@/components/insights/segment-breakdown";
import { DivergingPersonas } from "@/components/insights/diverging-personas";
import { formatNumber } from "@/lib/utils";

interface Insight {
  id: number;
  simulation_id: number;
  verdict: "launch" | "optimize" | "halt";
  confidence: number;
  summary: string;
  reasoning: string;
  top_concerns: string[];
  top_positives: string[];
  segment_breakdown: { segment: string; verdict_lean?: string; note?: string }[];
  diverging_personas: number[];
  metrics: {
    total: number;
    successful: number;
    failed: number;
    avg_purchase_intent: number;
    sentiment_pct: { positive: number; neutral: number; negative: number };
    would_recommend_pct: { yes: number; no: number; maybe: number };
    intent_distribution: number[];
    by_age_bucket: { segment: string; count: number; avg_intent: number; positive_pct: number; negative_pct: number }[];
    by_risk_tolerance: { segment: string; count: number; avg_intent: number; positive_pct: number; negative_pct: number }[];
  };
  created_at: string;
}

interface Sim {
  id: number;
  name: string;
  status: string;
  audience_id: number;
  product_id: number;
}

interface Product { name: string; category: string; description: string; }
interface Audience { name: string; persona_ids: number[]; }

export default function InsightDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const simId = Number(id);
  const [synthesizing, setSynthesizing] = useState(false);

  const sim = useQuery<Sim>({
    queryKey: ["simulation", simId],
    queryFn: () => api.get<Sim>(`/simulations/${simId}`),
  });
  const insight = useQuery<Insight>({
    queryKey: ["insight", simId],
    queryFn: () => api.get<Insight>(`/simulations/${simId}/insight`),
    retry: 0,
  });
  const product = useQuery<Product>({
    queryKey: ["product", sim.data?.product_id],
    queryFn: () => api.get<Product>(`/products/${sim.data!.product_id}`),
    enabled: !!sim.data,
  });
  const audience = useQuery<Audience>({
    queryKey: ["audience", sim.data?.audience_id],
    queryFn: () => api.get<Audience>(`/audiences/${sim.data!.audience_id}`),
    enabled: !!sim.data,
  });

  async function triggerSynthesis() {
    setSynthesizing(true);
    try {
      await api.post(`/simulations/${simId}/synthesize`, {});
      toast.success("Insight synthesized");
      await insight.refetch();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(`Synthesis failed: ${msg.slice(0, 120)}`);
    } finally {
      setSynthesizing(false);
    }
  }

  return (
    <div className="px-8 py-10 max-w-7xl mx-auto space-y-6">
      <div className="space-y-3">
        <Button asChild variant="ghost" size="sm" className="-ml-3">
          <Link href="/insights">
            <ArrowLeft className="size-4" />
            All insights
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {sim.data?.name ?? `Simulation #${simId}`}
          </h1>
          {(product.data || audience.data) && (
            <p className="text-sm text-muted-foreground mt-1">
              {product.data?.name}
              {audience.data && ` · ${audience.data.name} (${audience.data.persona_ids.length} personas)`}
            </p>
          )}
        </div>
      </div>

      {insight.isLoading && (
        <p className="text-sm text-muted-foreground">Loading insight…</p>
      )}

      {!insight.isLoading && !insight.data && (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center space-y-3">
            <Sparkles className="size-8 mx-auto text-primary" />
            <h3 className="font-semibold">Insight not synthesized yet</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              The verdict layer runs Claude Haiku 4.5 over agent responses.
              Trigger it once the simulation has completed.
            </p>
            <Button onClick={triggerSynthesis} disabled={synthesizing}>
              {synthesizing ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              {synthesizing ? "Synthesizing..." : "Synthesize now"}
            </Button>
          </CardContent>
        </Card>
      )}

      {insight.data && <Dashboard simId={simId} insight={insight.data} />}
    </div>
  );
}

function Dashboard({ simId, insight }: { simId: number; insight: Insight }) {
  const m = insight.metrics;
  return (
    <div className="space-y-6">
      <VerdictCard
        verdict={insight.verdict}
        confidence={insight.confidence}
        summary={insight.summary}
        reasoning={insight.reasoning}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Responses" value={formatNumber(m.successful)} sub={`of ${m.total} agents`} />
        <Stat label="Avg purchase intent" value={`${m.avg_purchase_intent}`} sub="out of 5" />
        <Stat label="Positive sentiment" value={`${m.sentiment_pct.positive}%`} sub={`${m.sentiment_pct.negative}% negative`} />
        <Stat label="Would recommend" value={`${m.would_recommend_pct.yes}%`} sub={`${m.would_recommend_pct.no}% wouldn't`} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SentimentDonut
          positive={m.sentiment_pct.positive}
          neutral={m.sentiment_pct.neutral}
          negative={m.sentiment_pct.negative}
        />
        <IntentDistribution distribution={m.intent_distribution} average={m.avg_purchase_intent} />
      </div>

      <RecommendBar
        yes={m.would_recommend_pct.yes}
        no={m.would_recommend_pct.no}
        maybe={m.would_recommend_pct.maybe}
      />

      <ConcernsLists concerns={insight.top_concerns} positives={insight.top_positives} />

      {insight.diverging_personas.length > 0 && (
        <DivergingPersonas simId={simId} personaIds={insight.diverging_personas} />
      )}

      <SegmentBreakdown
        fromLLM={insight.segment_breakdown}
        byRisk={m.by_risk_tolerance}
        byAge={m.by_age_bucket}
      />
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card className="bg-surface-elevated border-0">
      <CardContent className="p-4">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-2xl font-bold mt-1 tabular-nums text-foreground">{value}</div>
        {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
      </CardContent>
    </Card>
  );
}
