"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { RotateCcw, ShieldCheck, ShieldAlert, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface LlmHealth {
  configured: boolean;
  reason: string;
  agent_model: string;
  synthesizer_model: string;
  debate_model: string;
}

interface DemoState {
  personas: number;
  personas_baseline: number;
  audiences: number;
  products: number;
  products_template: number;
  surveys: number;
  simulations: number;
}

interface ResetReport {
  simulations_cleared: number;
  custom_products_removed: number;
  personas_removed: number;
  custom_audiences_removed: number;
  custom_surveys_removed: number;
  state: DemoState;
}

/** LLM-connectivity chip — green when a real key is configured, amber otherwise. */
function LlmHealthChip() {
  const { data, isPending } = useQuery({
    queryKey: ["llm-health"],
    queryFn: () => api.get<LlmHealth>("/admin/llm-health"),
    refetchInterval: 60_000,
  });

  if (isPending) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <Loader2 className="size-3 animate-spin" aria-hidden />
        Checking LLM…
      </span>
    );
  }

  const ok = data?.configured;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-[11px] font-medium",
        ok ? "text-success" : "text-warning"
      )}
      title={data?.reason}
    >
      {ok ? (
        <ShieldCheck className="size-3.5" aria-hidden />
      ) : (
        <ShieldAlert className="size-3.5" aria-hidden />
      )}
      {ok ? "LLM connected" : "LLM not configured"}
    </span>
  );
}

export function DemoControls() {
  const [open, setOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const qc = useQueryClient();

  const state = useQuery({
    queryKey: ["admin-state"],
    queryFn: () => api.get<DemoState>("/admin/state"),
    enabled: open, // only fetch counts when the confirm dialog is open
  });

  const runReset = async () => {
    setResetting(true);
    try {
      const report = await api.post<ResetReport>("/admin/reset", {});
      // Reset touches every collection — refresh the whole cache.
      qc.invalidateQueries();
      const cleared = report.simulations_cleared;
      toast.success(
        `Demo reset to clean state — cleared ${cleared} simulation${
          cleared === 1 ? "" : "s"
        } and restored the baseline.`
      );
      setOpen(false);
    } catch (err) {
      toast.error(`Reset failed: ${String(err).slice(0, 120)}`);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="flex items-center justify-between gap-2">
      {/* <LlmHealthChip /> */}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {/* <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="size-3.5" aria-hidden />
            Reset demo
          </Button> */}
        </DialogTrigger>

        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reset to a clean demo state</DialogTitle>
            <DialogDescription>
              Restores the known-good baseline so every walkthrough starts
              identical. This does <strong>not</strong> call the LLM and keeps
              the generated persona pool intact.
            </DialogDescription>
          </DialogHeader>

          <Separator />

          <div className="space-y-3 text-sm">
            <p className="font-medium">This will:</p>
            <ul className="space-y-1.5 text-muted-foreground">
              <li>• Clear all simulation runs, responses, and insights</li>
              <li>• Remove custom products created during the demo</li>
              <li>• Remove imported / hand-added personas (keeps the seeded pool)</li>
              <li>• Restore the baseline templates, surveys, and demo audiences</li>
            </ul>

            <div className="rounded-md border border-border bg-muted/40 p-3">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Current state
              </p>
              {state.isPending ? (
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Loader2 className="size-3 animate-spin" aria-hidden />
                  Loading…
                </span>
              ) : state.data ? (
                <dl className="grid grid-cols-3 gap-y-1.5 gap-x-2 text-xs">
                  <Stat label="Personas" value={state.data.personas} />
                  <Stat label="Audiences" value={state.data.audiences} />
                  <Stat label="Products" value={state.data.products} />
                  <Stat label="Surveys" value={state.data.surveys} />
                  <Stat label="Simulations" value={state.data.simulations} />
                </dl>
              ) : (
                <span className="text-xs text-muted-foreground">
                  Could not load state.
                </span>
              )}
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              disabled={resetting}
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={resetting}
              onClick={runReset}
              className="flex-1"
            >
              {resetting ? "Resetting…" : "Reset demo"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-semibold tabular-nums text-foreground">
        {value.toLocaleString()}
      </dd>
    </div>
  );
}
