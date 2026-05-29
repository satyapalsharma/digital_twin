"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye } from "lucide-react";
import { api } from "@/lib/api";

interface Persona {
  id: number;
  name: string;
  age: number;
  occupation: string;
  region: string;
  risk_tolerance: string;
  bio: string;
}

interface ResponseRow {
  persona_id: number;
  purchase_intent: number;
  sentiment: string;
  response: { reasoning?: string; top_concern?: string };
}

interface Props {
  simId: number;
  personaIds: number[];
}

export function DivergingPersonas({ simId, personaIds }: Props) {
  const responses = useQuery<ResponseRow[]>({
    queryKey: ["sim-responses-div", simId],
    queryFn: () => api.get<ResponseRow[]>(`/simulations/${simId}/responses`),
  });
  const personas = useQuery<Persona[]>({
    queryKey: ["personas-for-div"],
    queryFn: () => api.get<Persona[]>(`/personas?limit=500`),
  });

  if (personaIds.length === 0) return null;

  const responsesById = new Map(
    (responses.data ?? []).map((r) => [r.persona_id, r])
  );
  const personasById = new Map((personas.data ?? []).map((p) => [p.id, p]));

  const rows = personaIds
    .map((pid) => ({
      persona: personasById.get(pid),
      response: responsesById.get(pid),
    }))
    .filter((r) => r.persona);

  return (
    <Card className="border-warning/30 bg-warning/5">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Eye className="size-4 text-warning" />
          Diverging opinions
          <Badge variant="muted" className="text-[10px] ml-1">
            ones to watch
          </Badge>
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          These personas most contradicted the majority verdict. Their reasoning
          is the strongest counter-signal.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.map(({ persona, response }) => (
          <div
            key={persona!.id}
            className="rounded-md border border-border bg-surface p-3 text-sm"
          >
            <div className="flex items-center justify-between mb-1">
              <div className="font-medium">
                {persona!.name}
                <span className="text-muted-foreground font-normal ml-2 text-xs">
                  {persona!.age}y · {persona!.occupation} · {persona!.region}
                </span>
              </div>
              {response && (
                <Badge variant="outline" className="text-[10px] tabular-nums">
                  intent {response.purchase_intent}/5 · {response.sentiment}
                </Badge>
              )}
            </div>
            {response?.response?.reasoning && (
              <p className="text-foreground/80 italic text-xs leading-relaxed mt-1.5">
                &ldquo;{response.response.reasoning}&rdquo;
              </p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
