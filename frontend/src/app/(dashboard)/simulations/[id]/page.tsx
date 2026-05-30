"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { LiveProgress } from "@/components/simulations/live-progress";
import { ResponsesTable } from "@/components/simulations/responses-table";
import { DebateTranscript } from "@/components/simulations/debate-transcript";

interface SimDetail {
  id: number;
  name: string;
  mode: string;
  status: string;
  audience_id: number;
  product_id: number;
  progress: number;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  error: string | null;
}

interface Audience {
  id: number;
  name: string;
  persona_ids: number[];
}
interface Product {
  id: number;
  name: string;
  category: string;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function SimulationDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const simId = Number(id);
  const router = useRouter();
  const qc = useQueryClient();
  const [busy, setBusy] = useState<"restart" | "delete" | null>(null);

  const sim = useQuery<SimDetail>({
    queryKey: ["simulation", simId],
    queryFn: () => api.get<SimDetail>(`/simulations/${simId}`),
  });

  async function handleRestart() {
    setBusy("restart");
    try {
      await api.post(`/simulations/${simId}/restart`, {});
      toast.success("Restarted — streaming will resume");
      qc.invalidateQueries({ queryKey: ["simulation", simId] });
      qc.invalidateQueries({ queryKey: ["sim-responses", simId] });
    } catch (e) {
      toast.error(`Restart failed: ${String(e).slice(0, 120)}`);
    } finally {
      setBusy(null);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this simulation? Responses will be lost.")) return;
    setBusy("delete");
    try {
      await api.delete(`/simulations/${simId}`);
      toast.success("Deleted");
      router.push("/simulations");
    } catch (e) {
      toast.error(`Delete failed: ${String(e).slice(0, 120)}`);
      setBusy(null);
    }
  }
  const audience = useQuery<Audience>({
    queryKey: ["audience", sim.data?.audience_id],
    queryFn: () => api.get<Audience>(`/audiences/${sim.data!.audience_id}`),
    enabled: !!sim.data,
  });
  const product = useQuery<Product>({
    queryKey: ["product", sim.data?.product_id],
    queryFn: () => api.get<Product>(`/products/${sim.data!.product_id}`),
    enabled: !!sim.data,
  });

  if (sim.isLoading) {
    return (
      <div className="px-8 py-10 max-w-5xl mx-auto">
        <p className="text-sm text-muted-foreground">Loading simulation...</p>
      </div>
    );
  }

  if (!sim.data) {
    return (
      <div className="px-8 py-10 max-w-5xl mx-auto">
        <p className="text-sm text-destructive">Simulation not found.</p>
      </div>
    );
  }

  const s = sim.data;
  const totalExpected = audience.data?.persona_ids.length;

  return (
    <div className="px-8 py-10 max-w-5xl mx-auto space-y-6">
      <div className="space-y-3">
        <Button asChild variant="ghost" size="sm" className="-ml-3">
          <Link href="/simulations">
            <ArrowLeft className="size-4" />
            All simulations
          </Link>
        </Button>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{s.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {product.data ? `${product.data.name}` : `Product #${s.product_id}`}
              {" · "}
              {audience.data ? `${audience.data.name}` : `Audience #${s.audience_id}`}
              {totalExpected ? ` (${totalExpected} personas)` : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{s.mode}</Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRestart}
              disabled={busy !== null || s.status === "running"}
            >
              <RotateCcw className="size-3.5" />
              Restart
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={busy !== null}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        </div>
      </div>

      <LiveProgress
        simId={simId}
        initialStatus={s.status}
        totalExpected={s.mode === "debate" ? 15 : totalExpected}
      />

      {s.status === "completed" && s.mode === "survey" && (
        <Card className="bg-primary/5 border-primary/30">
          <CardContent className="p-6 flex items-center justify-between gap-3">
            <p className="text-sm">
              <span className="font-medium">Verdict ready.</span>{" "}
              View the Launch / Optimize / Halt recommendation with full
              reasoning, charts, and diverging opinions.
            </p>
            <Button asChild>
              <Link href={`/insights/${simId}`}>Open insights</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {s.mode === "debate" ? (
        <DebateTranscript simId={simId} status={s.status} totalExpected={15} />
      ) : (
        <ResponsesTable simId={simId} />
      )}
    </div>
  );
}
