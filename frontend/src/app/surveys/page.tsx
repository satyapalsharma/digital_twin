"use client";

import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, ClipboardList, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";

interface Survey {
  id: number;
  name: string;
  description: string;
  questions: { id: string; type: string; prompt: string }[];
  created_at: string;
}

export default function SurveysPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery<Survey[]>({
    queryKey: ["surveys"],
    queryFn: () => api.get<Survey[]>("/surveys"),
  });

  async function handleDelete(id: number, name: string) {
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      await api.delete(`/surveys/${id}`);
      toast.success(`Deleted "${name}"`);
      qc.invalidateQueries({ queryKey: ["surveys"] });
    } catch (e) {
      toast.error(`Delete failed: ${String(e).slice(0, 120)}`);
    }
  }

  const surveys = data ?? [];

  return (
    <div className="px-8 py-10 max-w-5xl mx-auto space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Surveys</h1>
          <p className="text-muted-foreground mt-1">
            Custom question sets for your simulations. Built-in default has 5
            questions covering purchase intent, sentiment, concerns, and recommendation.
          </p>
        </div>
        <Button asChild>
          <Link href="/surveys/new">
            <Plus className="size-4" />
            New survey
          </Link>
        </Button>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading surveys...</p>}

      {!isLoading && surveys.length === 0 && (
        <Card className="border-dashed bg-surface-elevated/30">
          <CardContent className="py-12 text-center space-y-3">
            <ClipboardList className="size-8 mx-auto text-muted-foreground" />
            <div>
              <h3 className="font-semibold">No custom surveys yet</h3>
              <p className="text-sm text-muted-foreground mt-1">
                The 5-question default survey is used automatically. Create a
                custom one for specialized product tests.
              </p>
            </div>
            <Button asChild>
              <Link href="/surveys/new">
                <Plus className="size-4" />
                Create first survey
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {surveys.map((s) => (
          <Card key={s.id} className="hover:border-primary/40 transition-colors">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="size-10 rounded-lg bg-primary/10 text-primary grid place-items-center shrink-0">
                <ClipboardList className="size-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-medium">{s.name}</h4>
                  <Badge variant="muted">{s.questions.length} questions</Badge>
                </div>
                {s.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                    {s.description}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(s.id, s.name)}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="size-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
