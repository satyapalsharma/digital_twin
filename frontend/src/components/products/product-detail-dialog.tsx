"use client";

import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Trash2,
  Target,
  FlaskConical,
  Gauge,
  SlidersHorizontal,
  PlayCircle,
  Pencil,
  Copy,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/api";
import {
  formatConfigValue,
  headlineChip,
  humanizeKey,
  scenarioMeta,
} from "@/lib/product-meta";

interface ProductDetailProps {
  product: {
    id: number;
    name: string;
    category: string;
    scenario_type: string;
    description: string;
    config: Record<string, unknown>;
    is_template: boolean;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Invoked to edit a custom product — parent opens the edit form. */
  onEdit?: (id: number) => void;
}

export function ProductDetailDialog({
  product,
  open,
  onOpenChange,
  onEdit,
}: ProductDetailProps) {
  const qc = useQueryClient();

  const handleDelete = async () => {
    if (!product || !confirm("Delete this product? This action cannot be undone.")) {
      return;
    }
    try {
      await api.delete(`/products/${product.id}`);
      toast.success("Product deleted");
      qc.invalidateQueries({ queryKey: ["products"] });
      onOpenChange(false);
    } catch (error) {
      toast.error(`Delete failed: ${String(error).slice(0, 100)}`);
    }
  };

  const handleClone = async () => {
    if (!product) return;
    try {
      await api.post("/products", {
        name: `${product.name} (copy)`,
        category: product.category,
        scenario_type: product.scenario_type,
        description: product.description,
        config: product.config ?? {},
        is_template: false,
      });
      toast.success("Cloned to a custom product you can edit");
      qc.invalidateQueries({ queryKey: ["products"] });
      onOpenChange(false);
    } catch (error) {
      toast.error(`Clone failed: ${String(error).slice(0, 100)}`);
    }
  };

  if (!product) return null;

  const meta = scenarioMeta(product.scenario_type);
  const config = product.config ?? {};
  const configEntries = Object.entries(config);
  const chip = headlineChip(product.scenario_type, config);

  // PM framing fields can be authored into config; otherwise fall back to the
  // scenario-type defaults so every product reads like a briefing.
  const hypothesis = String(config.hypothesis ?? meta.hypothesis);
  const targetSegment = config.target_segment
    ? String(config.target_segment)
    : config.targeting
      ? humanizeKey(String(config.targeting))
      : "All eligible policyholders";

  const leverEntries = configEntries.filter(
    ([k]) => !["hypothesis", "target_segment"].includes(k)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <div className="flex items-start justify-between gap-3 pr-6">
            <div className="min-w-0">
              <DialogTitle className="text-xl leading-snug">{product.name}</DialogTitle>
              <DialogDescription className="flex flex-wrap items-center gap-1.5 pt-2">
                <Badge variant="secondary">{product.category}</Badge>
                <Badge variant="outline">{meta.label}</Badge>
                <Badge variant={product.is_template ? "success" : "muted"} className="text-[10px]">
                  {product.is_template ? "Template" : "Custom"}
                </Badge>
              </DialogDescription>
            </div>
            {chip && (
              <div className="shrink-0 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-center">
                <p className="text-sm font-semibold text-primary leading-none">{chip}</p>
                <p className="text-[10px] text-muted-foreground mt-1">key lever</p>
              </div>
            )}
          </div>
        </DialogHeader>

        <Separator />

        {/* The play */}
        <Section icon={FlaskConical} title="The play">
          <p className="text-sm text-foreground/90 leading-relaxed">
            {product.description || meta.summary}
          </p>
        </Section>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Hypothesis */}
          <Section icon={FlaskConical} title="Hypothesis to test">
            <p className="text-sm text-foreground/80 leading-relaxed italic">
              &ldquo;{hypothesis}&rdquo;
            </p>
          </Section>

          {/* Target */}
          <Section icon={Target} title="Target segment">
            <p className="text-sm text-foreground/80 leading-relaxed">{targetSegment}</p>
          </Section>
        </div>

        {/* Levers */}
        {leverEntries.length > 0 && (
          <Section icon={SlidersHorizontal} title="Configuration levers">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm rounded-md border border-border bg-surface-elevated/40 p-3">
              {leverEntries.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3">
                  <dt className="text-muted-foreground truncate">{humanizeKey(k)}</dt>
                  <dd className="font-medium text-right">{formatConfigValue(k, v)}</dd>
                </div>
              ))}
            </dl>
          </Section>
        )}

        {/* KPIs */}
        <Section icon={Gauge} title="KPIs to watch">
          <div className="flex flex-wrap gap-1.5">
            {meta.kpis.map((kpi) => (
              <Badge key={kpi} variant="outline" className="font-normal">
                {kpi}
              </Badge>
            ))}
          </div>
        </Section>

        <Separator />

        <div className="flex gap-2">
          <Button asChild className="flex-1" size="sm">
            <a href={`/simulations?product=${product.id}`}>
              <PlayCircle className="size-4" />
              Run with an audience
            </a>
          </Button>
          {product.is_template ? (
            <Button variant="outline" size="sm" onClick={handleClone}>
              <Copy className="size-4" />
              Clone &amp; customize
            </Button>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={() => onEdit?.(product.id)}>
                <Pencil className="size-4" />
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                aria-label="Delete product"
                title="Delete product"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="size-4" />
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <Icon className="size-3.5" />
        {title}
      </h3>
      {children}
    </div>
  );
}
