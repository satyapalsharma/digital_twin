"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { PlayCircle, Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";

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
interface Survey {
  id: number;
  name: string;
  questions: unknown[];
}

const DEFAULT_SURVEY_VALUE = "__default__";

export function NewSimulationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetProduct = searchParams.get("product") ?? undefined;

  const [name, setName] = useState("");
  const [mode, setMode] = useState<"survey" | "debate">("survey");
  const [audienceId, setAudienceId] = useState<string>("");
  const [productId, setProductId] = useState<string>(presetProduct ?? "");
  const [surveyId, setSurveyId] = useState<string>(DEFAULT_SURVEY_VALUE);
  const [submitting, setSubmitting] = useState(false);

  const audiences = useQuery({
    queryKey: ["audiences"],
    queryFn: () => api.get<Audience[]>("/audiences"),
  });
  const products = useQuery({
    queryKey: ["products"],
    queryFn: () => api.get<Product[]>("/products"),
  });
  const surveys = useQuery({
    queryKey: ["surveys"],
    queryFn: () => api.get<Survey[]>("/surveys"),
  });

  async function handleRun() {
    if (!audienceId || !productId) {
      toast.error("Pick an audience and a product");
      return;
    }
    setSubmitting(true);
    try {
      const sim = await api.post<{ id: number }>("/simulations", {
        name: name.trim(),
        mode,
        audience_id: Number(audienceId),
        product_id: Number(productId),
        survey_id:
          mode === "survey" && surveyId !== DEFAULT_SURVEY_VALUE
            ? Number(surveyId)
            : null,
      });
      toast.success("Simulation started");
      router.push(`/simulations/${sim.id}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(`Start failed: ${msg.slice(0, 120)}`);
      setSubmitting(false);
    }
  }

  const selectedAudience = audiences.data?.find((a) => String(a.id) === audienceId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">New simulation</CardTitle>
        <CardDescription>
          Run a product through your customer pool. Uses the 5-question default
          survey unless you build a custom one.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Audience">
            <Select value={audienceId} onValueChange={setAudienceId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose audience..." />
              </SelectTrigger>
              <SelectContent>
                {(audiences.data ?? []).map((a) => (
                  <SelectItem key={a.id} value={String(a.id)}>
                    {a.name} ({a.persona_ids.length} personas)
                  </SelectItem>
                ))}
                {audiences.data && audiences.data.length === 0 && (
                  <div className="px-2 py-2 text-xs text-muted-foreground">
                    No audiences yet — build one at /audiences
                  </div>
                )}
              </SelectContent>
            </Select>
            {selectedAudience && (
              <p className="text-xs text-muted-foreground mt-1">
                {selectedAudience.persona_ids.length} personas will be queried in parallel
              </p>
            )}
          </Field>

          <Field label="Product / scenario">
            <Select value={productId} onValueChange={setProductId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose product..." />
              </SelectTrigger>
              <SelectContent>
                {(products.data ?? []).map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Survey (optional)">
            <Select
              value={surveyId}
              onValueChange={setSurveyId}
              disabled={mode === "debate"}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={DEFAULT_SURVEY_VALUE}>
                  Built-in default (5 questions)
                </SelectItem>
                {(surveys.data ?? []).map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.name} ({s.questions.length} q)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {mode === "debate" && (
              <p className="text-xs text-muted-foreground mt-1">
                Debate mode uses its own discussion flow, not surveys.
              </p>
            )}
          </Field>

          <Field label="Run name (optional)">
            <Input
              placeholder='e.g. "Premium hike v1"'
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>

          <Field label="Mode">
            <Select value={mode} onValueChange={(v) => setMode(v as "survey" | "debate")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="survey">Survey — parallel responses</SelectItem>
                <SelectItem value="debate">Debate — focus-group transcript</SelectItem>
              </SelectContent>
            </Select>
            {mode === "debate" && (
              <p className="text-xs text-muted-foreground mt-1">
                Picks 5 diverse personas, runs 3 rounds (opening → cross-talk → final).
                ~30-60s.
              </p>
            )}
          </Field>
        </div>

        <Button
          onClick={handleRun}
          disabled={submitting || !audienceId || !productId}
          size="lg"
          className="w-full md:w-auto"
        >
          {submitting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <PlayCircle className="size-4" />
          )}
          {submitting ? "Starting..." : "Run simulation"}
        </Button>
      </CardContent>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}
