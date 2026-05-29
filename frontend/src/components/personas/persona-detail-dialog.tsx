"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";
import { PersonaAvatar } from "./avatar";

export interface Persona {
  id: number;
  name: string;
  age: number;
  gender: string;
  income: number;
  occupation: string;
  region: string;
  marital_status: string;
  dependents: number;
  risk_tolerance: string;
  claims_history: string;
  attributes: Record<string, unknown>;
  bio: string;
}

interface Props {
  persona: Persona | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const riskColor = {
  low: "success",
  medium: "warning",
  high: "destructive",
} as const;

export function PersonaDetailDialog({ persona, open, onOpenChange }: Props) {
  if (!persona) return null;
  const a = persona.attributes ?? {};

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <PersonaAvatar id={persona.id} name={persona.name} size="lg" ring />
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-xl">{persona.name}</DialogTitle>
              <DialogDescription>
                {persona.age}y · {persona.occupation} · {persona.region}
              </DialogDescription>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-3">
            <Badge variant="muted">{persona.marital_status}</Badge>
            <Badge variant="muted">{persona.dependents} deps</Badge>
            <Badge variant={riskColor[persona.risk_tolerance as keyof typeof riskColor] ?? "muted"}>
              risk: {persona.risk_tolerance}
            </Badge>
            <Badge variant="outline">claims: {persona.claims_history}</Badge>
          </div>
        </DialogHeader>

        <Separator />

        {/* Demographics grid */}
        <Section title="Demographics">
          <DataGrid
            items={[
              ["Income", formatCurrency(persona.income)],
              ["Gender", persona.gender],
              ["Education", String(a.education ?? "—")],
              ["Life stage", String(a.life_stage ?? "—")],
              ["Tech savviness", String(a.tech_savviness ?? "—")],
            ]}
          />
        </Section>

        {/* Current insurance */}
        {Array.isArray(a.current_policies) && a.current_policies.length > 0 && (
          <Section title="Current policies">
            <div className="flex flex-wrap gap-1.5">
              {(a.current_policies as string[]).map((p) => (
                <Badge key={p} variant="outline" className="capitalize">
                  {p.replace(/_/g, " ")}
                </Badge>
              ))}
            </div>
          </Section>
        )}

        {/* Priorities */}
        {Array.isArray(a.financial_priorities) && a.financial_priorities.length > 0 && (
          <Section title="Financial priorities">
            <ul className="list-disc list-inside text-sm text-foreground/90 space-y-0.5">
              {(a.financial_priorities as string[]).map((p) => (
                <li key={p} className="capitalize">
                  {p.replace(/_/g, " ")}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Key concerns */}
        {Array.isArray(a.key_concerns) && a.key_concerns.length > 0 && (
          <Section title="Key concerns">
            <ul className="list-disc list-inside text-sm text-foreground/90 space-y-0.5">
              {(a.key_concerns as string[]).map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </Section>
        )}

        {/* Bio */}
        {persona.bio && (
          <Section title="Bio">
            <p className="text-sm text-foreground/90 italic leading-relaxed">
              &ldquo;{persona.bio}&rdquo;
            </p>
          </Section>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      {children}
    </div>
  );
}

function DataGrid({ items }: { items: [string, string][] }) {
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
      {items.map(([k, v]) => (
        <div key={k} className="flex justify-between">
          <dt className="text-muted-foreground">{k}</dt>
          <dd className="font-medium text-right ml-2 truncate">{v}</dd>
        </div>
      ))}
    </dl>
  );
}
