"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import type { Persona } from "./persona-detail-dialog";
import { PersonaAvatar } from "./avatar";

interface Props {
  personas: Persona[];
  onSelect: (p: Persona) => void;
}

const riskBadge = {
  low: "success",
  medium: "warning",
  high: "destructive",
} as const;

export function PersonasTable({ personas, onSelect }: Props) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    if (!q.trim()) return personas;
    const needle = q.toLowerCase();
    return personas.filter(
      (p) =>
        p.name.toLowerCase().includes(needle) ||
        p.occupation.toLowerCase().includes(needle) ||
        p.region.toLowerCase().includes(needle)
    );
  }, [personas, q]);

  return (
    <div className="space-y-3">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, occupation, or region..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="rounded-lg border border-border overflow-hidden bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-elevated text-muted-foreground">
              <tr className="text-left">
                <Th>Name</Th>
                <Th className="text-right">Age</Th>
                <Th>Occupation</Th>
                <Th className="text-right">Income</Th>
                <Th>Region</Th>
                <Th>Risk</Th>
                <Th>Claims</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => onSelect(p)}
                  className="border-t border-border hover:bg-primary/5 cursor-pointer transition-colors"
                >
                  <Td>
                    <div className="flex items-center gap-2">
                      <div className="size-7 rounded-full bg-primary/15 text-primary grid place-items-center text-[10px] font-semibold">
                        {p.name.split(" ").map((s) => s[0]).slice(0, 2).join("")}
                      </div>
                      <span className="font-medium">{p.name}</span>
                    </div>
                  </Td>
                  <Td className="text-right tabular-nums">{p.age}</Td>
                  <Td className="text-muted-foreground">{p.occupation}</Td>
                  <Td className="text-right tabular-nums">{formatCurrency(p.income)}</Td>
                  <Td className="text-muted-foreground">{p.region}</Td>
                  <Td>
                    <Badge
                      variant={riskBadge[p.risk_tolerance as keyof typeof riskBadge] ?? "muted"}
                      className="capitalize"
                    >
                      {p.risk_tolerance}
                    </Badge>
                  </Td>
                  <Td className="text-muted-foreground capitalize">{p.claims_history}</Td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-muted-foreground">
                    {personas.length === 0
                      ? "No personas yet. Run scripts/seed_personas.py to generate."
                      : "No personas match your search."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Showing {filtered.length} of {personas.length}
        {q && " (filtered)"}
      </p>
    </div>
  );
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={cn("px-4 py-2.5 font-medium text-xs uppercase tracking-wider", className)}>
      {children}
    </th>
  );
}

function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={cn("px-4 py-3", className)}>{children}</td>;
}
