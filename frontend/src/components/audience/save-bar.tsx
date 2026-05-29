"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { FilterState, toApiPayload } from "@/lib/audience-options";

interface Props {
  filter: FilterState;
  total: number | undefined;
  onSaved: () => void;
}

export function SaveBar({ filter, total, onSaved }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name.trim()) {
      toast.error("Give your audience a name first");
      return;
    }
    if (total === 0) {
      toast.error("No personas match — adjust your filters");
      return;
    }
    setSaving(true);
    try {
      const created = await api.post<{ id: number; name: string }>("/audiences", {
        name: name.trim(),
        description: description.trim(),
        filter: toApiPayload(filter),
      });
      toast.success(`Saved "${created.name}"`);
      setName("");
      setDescription("");
      onSaved();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(`Save failed: ${msg.slice(0, 120)}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col md:flex-row gap-3 p-4 rounded-lg border border-border bg-surface-elevated">
      <Input
        placeholder='Audience name (e.g. "High-income retirees")'
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="md:max-w-xs"
      />
      <Input
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="flex-1"
      />
      <Button onClick={handleSave} disabled={saving || !name.trim()}>
        <Save className="size-4" />
        {saving ? "Saving..." : "Save audience"}
      </Button>
    </div>
  );
}
