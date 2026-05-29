"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { formatNumber } from "@/lib/utils";
import { PersonasTable } from "@/components/personas/personas-table";
import {
  Persona,
  PersonaDetailDialog,
} from "@/components/personas/persona-detail-dialog";

export default function PersonasPage() {
  const [selected, setSelected] = useState<Persona | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data, isLoading, isFetching, refetch } = useQuery<Persona[]>({
    queryKey: ["personas-all"],
    queryFn: () => api.get<Persona[]>("/personas?limit=500&offset=0"),
  });

  const { data: countData, isLoading: countLoading } = useQuery<{ total: number }>({
    queryKey: ["personas-count"],
    queryFn: () => api.get<{ total: number }>("/personas/count"),
  });

  const personas = data ?? [];
  const totalCount = countData?.total ?? 0;

  return (
    <div className="px-8 py-10 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Personas</h1>
          <p className="text-muted-foreground mt-1">
            The synthetic customer pool. Click a row to see the full profile.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="muted" className="text-sm py-1 px-3">
            {countLoading ? "…" : formatNumber(totalCount)} personas
          </Badge>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            {isFetching ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
            Refresh
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-9 max-w-md" />
          <Skeleton className="h-[420px] w-full" />
        </div>
      )}

      {!isLoading && personas.length === 0 && <EmptyState />}

      {!isLoading && personas.length > 0 && (
        <PersonasTable
          personas={personas}
          onSelect={(p) => {
            setSelected(p);
            setDialogOpen(true);
          }}
        />
      )}

      <PersonaDetailDialog
        persona={selected}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}

function EmptyState() {
  return (
    <Card className="border-dashed bg-surface-elevated/30">
      <CardContent className="py-12 text-center space-y-4">
        <div className="size-12 mx-auto rounded-full bg-primary/10 text-primary grid place-items-center">
          <Sparkles className="size-6" />
        </div>
        <div>
          <h3 className="font-semibold">No personas yet</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
            Generate the synthetic customer pool by running the seed script.
          </p>
        </div>
        <div className="bg-surface border border-border rounded-md p-3 max-w-md mx-auto text-left">
          <code className="text-xs font-mono text-foreground/80 block">
            cd backend
            <br />
            .venv/Scripts/python.exe -m scripts.seed_personas --target 500
          </code>
        </div>
        <p className="text-xs text-muted-foreground">
          Requires OPENROUTER_API_KEY in .env. ~$0.05 for 500 personas.
        </p>
      </CardContent>
    </Card>
  );
}
