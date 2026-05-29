"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { SimulationComparison } from "@/components/simulations/simulation-comparison";

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

export default function ComparePage() {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const sims = useQuery<SimDetail[]>({
    queryKey: ["simulations"],
    queryFn: () => api.get<SimDetail[]>("/simulations"),
  });

  const handleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id].slice(-3)
    );
  };

  const handleRemove = (id: number) => {
    setSelectedIds((prev) => prev.filter((x) => x !== id));
  };

  const selectedSims = (sims.data ?? []).filter((s) =>
    selectedIds.includes(s.id)
  );

  return (
    <div className="px-8 py-10 max-w-7xl mx-auto space-y-8">
      <div className="space-y-3">
        <Button asChild variant="ghost" size="sm" className="-ml-3">
          <Link href="/simulations">
            <ArrowLeft className="size-4" />
            Back to simulations
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Compare runs</h1>
          <p className="text-muted-foreground mt-1">
            Select up to 3 simulations to compare side-by-side.
          </p>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Selected for comparison</h2>
          <div className="flex gap-2 flex-wrap">
            {selectedSims.map((s) => (
              <Badge key={s.id} variant="outline" className="px-3 py-2 text-sm gap-2">
                {s.name}
                <button
                  onClick={() => handleRemove(s.id)}
                  className="hover:opacity-70"
                >
                  <X className="size-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {selectedIds.length > 0 && selectedSims.length === selectedIds.length && (
        <SimulationComparison simulationIds={selectedIds} />
      )}

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Available simulations</h2>
        {sims.isLoading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-[68px]" />
            ))}
          </div>
        ) : sims.data?.length === 0 ? (
          <Card className="border-dashed bg-surface-elevated/30">
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              No simulations available.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {(sims.data ?? []).map((s) => {
              const isSelected = selectedIds.includes(s.id);
              const isDisabled =
                selectedIds.length >= 3 && !isSelected;
              return (
                <Card
                  key={s.id}
                  className={`cursor-pointer transition-all ${
                    isSelected
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : isDisabled
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:border-primary/40 hover:shadow-sm"
                  }`}
                  onClick={() => !isDisabled && handleSelect(s.id)}
                >
                  <CardContent className="p-4 flex items-center gap-4">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleSelect(s.id)}
                      disabled={isDisabled}
                      className="h-4 w-4 rounded"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex-1">
                      <h4 className="font-medium">{s.name}</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {s.mode} · {s.status} · {new Date(s.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant={s.status === "completed" ? "success" : "outline"}>
                      {s.status}
                    </Badge>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
