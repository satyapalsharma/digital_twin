"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus } from "lucide-react";
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
  ConfigField,
  allManagedConfigKeys,
  scenarioConfigSchema,
} from "@/lib/product-meta";

export interface EditableProduct {
  id: number;
  name: string;
  category: string;
  scenario_type: string;
  description: string;
  config: Record<string, unknown>;
}

interface ProductFormProps {
  /** When set, the form edits this product instead of creating one. */
  product?: EditableProduct | null;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Show the built-in "Add custom product" trigger (create mode). */
  showTrigger?: boolean;
}

const SCENARIO_TYPES = [
  "premium_hike",
  "new_rider",
  "value_back",
  "telematics",
  "bundling",
  "claims_ux",
  "policy_renewal",
  "discount_offer",
  "channel_change",
  "custom",
] as const;

const CATEGORIES = ["Home", "Pet", "Auto", "Health", "Life", "Travel", "Retention", "Other"] as const;

interface FormState {
  name: string;
  category: string;
  scenario_type: string;
  description: string;
  hypothesis: string;
  target_segment: string;
}

const BLANK: FormState = {
  name: "",
  category: "Home",
  scenario_type: "custom",
  description: "",
  hypothesis: "",
  target_segment: "",
};

// Config field values are held as strings (checkboxes as "true"/"") and coerced
// to their typed form on submit.
function cfgFrom(p: EditableProduct | null | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!p) return out;
  const cfg = p.config ?? {};
  scenarioConfigSchema(p.scenario_type).forEach((f) => {
    const v = cfg[f.key];
    if (v === undefined || v === null) return;
    out[f.key] = f.type === "boolean" ? (v ? "true" : "") : String(v);
  });
  return out;
}

export function ProductForm({
  product,
  isOpen: controlledOpen,
  onOpenChange,
  showTrigger = true,
}: ProductFormProps) {
  const isEdit = !!product;
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormState>(BLANK);
  const [cfg, setCfg] = useState<Record<string, string>>({});
  const qc = useQueryClient();

  const isOpen = controlledOpen ?? open;
  const setIsOpen = onOpenChange ?? setOpen;

  // Sync values when the dialog opens / target product changes (render-time
  // sync avoids a setState-in-effect cascade — React 19 guidance).
  const [syncSig, setSyncSig] = useState<string | null>(null);
  const sig = isOpen ? String(product?.id ?? "new") : null;
  if (sig !== syncSig) {
    setSyncSig(sig);
    setFormData(product ? { ...BLANK, ...stateFrom(product) } : BLANK);
    setCfg(cfgFrom(product));
  }

  const schema = scenarioConfigSchema(formData.scenario_type);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const setCfgValue = (key: string, value: string) =>
    setCfg((prev) => ({ ...prev, [key]: value }));

  const validateAndBuildConfig = (): Record<string, unknown> | null => {
    // Preserve config keys this form doesn't manage.
    const config: Record<string, unknown> = { ...(product?.config ?? {}) };
    allManagedConfigKeys().forEach((k) => delete config[k]);

    if (formData.hypothesis.trim()) config.hypothesis = formData.hypothesis.trim();
    if (formData.target_segment.trim()) config.target_segment = formData.target_segment.trim();

    for (const f of schema) {
      const raw = (cfg[f.key] ?? "").trim();
      if (f.type === "boolean") {
        if (cfg[f.key] === "true") config[f.key] = true;
        continue;
      }
      if (!raw) continue; // optional — skip empty
      if (f.type === "text") {
        config[f.key] = raw;
        continue;
      }
      const num = Number(raw);
      if (Number.isNaN(num)) {
        toast.error(`${f.label} must be a number`);
        return null;
      }
      if (f.min !== undefined && num < f.min) {
        toast.error(`${f.label} must be ≥ ${f.min}`);
        return null;
      }
      if (f.max !== undefined && num > f.max) {
        toast.error(`${f.label} must be ≤ ${f.max}`);
        return null;
      }
      config[f.key] = num;
    }
    return config;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Product name is required");
      return;
    }
    const config = validateAndBuildConfig();
    if (config === null) return;

    setLoading(true);
    try {
      const payload = {
        name: formData.name,
        category: formData.category,
        scenario_type: formData.scenario_type,
        description: formData.description,
        config,
      };
      if (isEdit && product) {
        await api.patch(`/products/${product.id}`, payload);
        toast.success("Product updated");
      } else {
        await api.post("/products", { ...payload, is_template: false });
        toast.success("Product created successfully");
      }
      qc.invalidateQueries({ queryKey: ["products"] });
      if (!isEdit) { setFormData(BLANK); setCfg({}); }
      setIsOpen(false);
    } catch (error) {
      toast.error(`Failed to save product: ${String(error).slice(0, 100)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {showTrigger && (
        <DialogTrigger asChild>
          <Button size="sm" className="gap-2">
            <Plus className="size-4" />
            Add custom product
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit product" : "Create custom product"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update this product scenario. Templates are read-only — clone one to edit it."
              : "Define a new product scenario to test with your audiences."}
          </DialogDescription>
        </DialogHeader>
        <Separator />
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Product name *</label>
            <Input
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g. Premium Plus Bundle"
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                disabled={loading}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Scenario type</label>
              <select
                name="scenario_type"
                value={formData.scenario_type}
                onChange={handleInputChange}
                disabled={loading}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
              >
                {SCENARIO_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Brief description of this product..."
              disabled={loading}
              rows={3}
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm resize-none"
            />
          </div>

          {/* Scenario-specific, typed config levers */}
          {schema.length > 0 && (
            <>
              <Separator />
              <p className="text-xs font-medium text-muted-foreground -mb-1">
                {formData.scenario_type.replace(/_/g, " ")} levers
              </p>
              <div className="grid grid-cols-2 gap-3">
                {schema.map((f) => (
                  <ConfigInput
                    key={f.key}
                    field={f}
                    value={cfg[f.key] ?? ""}
                    onChange={(v) => setCfgValue(f.key, v)}
                    disabled={loading}
                  />
                ))}
              </div>
            </>
          )}

          <Separator />
          <p className="text-xs font-medium text-muted-foreground -mb-1">
            Product framing <span className="font-normal">(optional — sharpens the briefing & simulation)</span>
          </p>

          <div className="space-y-2">
            <label className="text-sm font-medium">Hypothesis to test</label>
            <textarea
              name="hypothesis"
              value={formData.hypothesis}
              onChange={handleInputChange}
              placeholder="e.g. Customers will accept a 10% increase if framed transparently…"
              disabled={loading}
              rows={2}
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm resize-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Target segment</label>
            <Input
              name="target_segment"
              value={formData.target_segment}
              onChange={handleInputChange}
              placeholder="e.g. High-claim ZIPs, tenure > 2 years"
              disabled={loading}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => setIsOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Saving..." : isEdit ? "Save changes" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function stateFrom(p: EditableProduct): FormState {
  const cfg = p.config ?? {};
  return {
    name: p.name,
    category: CATEGORIES.includes(p.category as (typeof CATEGORIES)[number]) ? p.category : "Other",
    scenario_type: p.scenario_type,
    description: p.description ?? "",
    hypothesis: typeof cfg.hypothesis === "string" ? cfg.hypothesis : "",
    target_segment: typeof cfg.target_segment === "string" ? cfg.target_segment : "",
  };
}

function ConfigInput({
  field, value, onChange, disabled,
}: {
  field: ConfigField;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  if (field.type === "boolean") {
    return (
      <label className="flex items-center gap-2 text-sm col-span-2 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={value === "true"}
          onChange={(e) => onChange(e.target.checked ? "true" : "")}
          disabled={disabled}
          className="size-4"
        />
        {field.label}
      </label>
    );
  }
  const suffix = field.type === "percent" ? "%" : field.type === "currency" ? "$" : null;
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">
        {field.label}{suffix ? ` (${suffix})` : ""}
      </label>
      <Input
        type={field.type === "text" ? "text" : "number"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        min={field.min}
        max={field.max}
        step={field.type === "percent" || field.type === "currency" ? "0.5" : "1"}
        disabled={disabled}
      />
    </div>
  );
}
