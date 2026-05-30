"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/layout/states";
import { api } from "@/lib/api";
import { formatNumber } from "@/lib/utils";
import { PersonasTable } from "@/components/personas/personas-table";
import { PersonaForm } from "@/components/personas/persona-form";
import { PersonaImportDialog } from "@/components/personas/persona-import-dialog";
import {
  Persona,
  PersonaDetailDialog,
} from "@/components/personas/persona-detail-dialog";

export default function PersonasPage() {
  const [selected, setSelected] = useState<Persona | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Persona | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery<Persona[]>({
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
        <div className="flex items-center gap-2 flex-wrap">
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
          <PersonaForm />
          <PersonaImportDialog />
        </div>
      </div>

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-9 max-w-md" />
          <Skeleton className="h-[420px] w-full" />
        </div>
      )}

      {isError && (
        <ErrorState description={String(error)} onRetry={() => refetch()} />
      )}

      {!isLoading && !isError && personas.length === 0 && <EmptyState />}

      {!isLoading && !isError && personas.length > 0 && (
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
        onEdit={(p) => {
          setDialogOpen(false);
          setEditing(p);
          setEditOpen(true);
        }}
      />

      <PersonaForm
        persona={editing}
        open={editOpen}
        onOpenChange={setEditOpen}
        showTrigger={false}
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
            Build your synthetic customer pool. Add one by hand, import your own
            data in bulk, or generate a full pool with the seed script.
          </p>
        </div>
        <div className="flex items-center justify-center gap-2">
          <PersonaForm />
          <PersonaImportDialog />
        </div>
        <div className="bg-surface border border-border rounded-md p-3 max-w-md mx-auto text-left">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">
            Or generate a full pool
          </p>
          <code className="text-xs font-mono text-foreground/80 block">
            cd backend
            <br />
            .venv/Scripts/python.exe -m scripts.seed_personas --target 500
          </code>
        </div>
        <p className="text-xs text-muted-foreground">
          The seed script requires OPENROUTER_API_KEY in .env. ~$0.05 for 500 personas.
        </p>
      </CardContent>
    </Card>
  );
}
