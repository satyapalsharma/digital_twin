"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/api";
import {
  CLAIMS_OPTIONS,
  DraftPersona,
  EMPTY_DRAFT,
  GENDER_OPTIONS,
  MARITAL_OPTIONS,
  RISK_OPTIONS,
} from "@/lib/persona-import";
import type { Persona } from "./persona-detail-dialog";
import { cn } from "@/lib/utils";

const nice = (s: string) =>
  s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

function draftFrom(p: Persona): DraftPersona {
  return {
    name: p.name,
    age: p.age,
    gender: p.gender,
    income: p.income,
    occupation: p.occupation,
    region: p.region,
    marital_status: p.marital_status,
    dependents: p.dependents,
    risk_tolerance: p.risk_tolerance,
    claims_history: p.claims_history,
    bio: p.bio ?? "",
    attributes: p.attributes ?? {},
    source: p.source ?? "user_created",
  };
}

interface Props {
  /** When provided, the form edits this persona instead of creating one. */
  persona?: Persona | null;
  /** Controlled open state (used for edit mode). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Show the built-in "Add persona" trigger button (create mode). */
  showTrigger?: boolean;
}

export function PersonaForm({ persona, open: controlledOpen, onOpenChange, showTrigger = true }: Props) {
  const isEdit = !!persona;
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<DraftPersona>(EMPTY_DRAFT);
  const qc = useQueryClient();

  // Load the edited persona's values whenever the dialog opens (or the target
  // persona changes). Render-time sync — see react.dev "storing info from
  // previous renders" — avoids a setState-in-effect cascade.
  const [syncSig, setSyncSig] = useState<string | null>(null);
  const sig = open ? String(persona?.id ?? "new") : null;
  if (sig !== syncSig) {
    setSyncSig(sig);
    if (open) setDraft(persona ? draftFrom(persona) : EMPTY_DRAFT);
  }

  const set = <K extends keyof DraftPersona>(key: K, v: DraftPersona[K]) =>
    setDraft((d) => ({ ...d, [key]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.name.trim()) return toast.error("Name is required");
    if (!draft.occupation.trim()) return toast.error("Occupation is required");
    if (!draft.region.trim()) return toast.error("Region is required");
    setSaving(true);
    try {
      if (isEdit && persona) {
        await api.patch(`/personas/${persona.id}`, draft);
        toast.success(`${draft.name} updated`);
      } else {
        await api.post("/personas", { ...draft, source: "user_created" });
        toast.success(`${draft.name} added to the persona pool`);
      }
      qc.invalidateQueries({ queryKey: ["personas-all"] });
      qc.invalidateQueries({ queryKey: ["personas-count"] });
      if (!isEdit) setDraft(EMPTY_DRAFT);
      setOpen(false);
    } catch (err) {
      toast.error(`Could not save persona: ${String(err).slice(0, 120)}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {showTrigger && (
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <UserPlus className="size-4" />
            Add persona
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit persona" : "Define a persona"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update this synthetic customer. Changes apply to every audience and future simulation."
              : "Hand-craft a synthetic customer. It joins the pool immediately and can be used in any audience or simulation."}
          </DialogDescription>
        </DialogHeader>
        <Separator />

        <form onSubmit={submit} className="space-y-4">
          <Field label="Full name *">
            <Input
              value={draft.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Jordan Castillo"
              disabled={saving}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Age">
              <Input
                type="number" min={18} max={100} value={draft.age}
                onChange={(e) => set("age", Number(e.target.value) || 18)}
                disabled={saving}
              />
            </Field>
            <Field label="Annual income (USD)">
              <Input
                type="number" min={0} step={1000} value={draft.income}
                onChange={(e) => set("income", Number(e.target.value) || 0)}
                disabled={saving}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Occupation *">
              <Input
                value={draft.occupation}
                onChange={(e) => set("occupation", e.target.value)}
                placeholder="e.g. Pediatric Nurse"
                disabled={saving}
              />
            </Field>
            <Field label="Region *">
              <Input
                value={draft.region}
                onChange={(e) => set("region", e.target.value)}
                placeholder="e.g. Texas"
                disabled={saving}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Gender">
              <NativeSelect value={draft.gender} onChange={(v) => set("gender", v)} options={GENDER_OPTIONS} disabled={saving} />
            </Field>
            <Field label="Marital status">
              <NativeSelect value={draft.marital_status} onChange={(v) => set("marital_status", v)} options={MARITAL_OPTIONS} disabled={saving} />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Field label="Dependents">
              <Input
                type="number" min={0} max={12} value={draft.dependents}
                onChange={(e) => set("dependents", Number(e.target.value) || 0)}
                disabled={saving}
              />
            </Field>
            <Field label="Risk tolerance">
              <NativeSelect value={draft.risk_tolerance} onChange={(v) => set("risk_tolerance", v)} options={RISK_OPTIONS} disabled={saving} />
            </Field>
            <Field label="Claims history">
              <NativeSelect value={draft.claims_history} onChange={(v) => set("claims_history", v)} options={CLAIMS_OPTIONS} disabled={saving} />
            </Field>
          </div>

          <Field label="Bio (first-person voice)">
            <textarea
              value={draft.bio}
              onChange={(e) => set("bio", e.target.value)}
              placeholder="2–3 sentences capturing their priorities and frustrations…"
              rows={3}
              disabled={saving}
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm resize-none"
            />
          </Field>

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" disabled={saving} onClick={() => setOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="flex-1">
              {saving ? "Saving…" : isEdit ? "Save changes" : "Add persona"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
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

function NativeSelect({
  value, onChange, options, disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
  disabled?: boolean;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={cn(
        "w-full h-9 px-3 rounded-md border border-input bg-background text-sm capitalize",
        "disabled:opacity-50 disabled:cursor-not-allowed"
      )}
    >
      {options.map((o) => (
        <option key={o} value={o}>{nice(o)}</option>
      ))}
    </select>
  );
}
