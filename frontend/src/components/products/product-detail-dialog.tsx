"use client";

import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
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
}

export function ProductDetailDialog({
  product,
  open,
  onOpenChange,
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

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{product.name}</DialogTitle>
          <DialogDescription className="flex items-center gap-2 text-xs pt-1">
            <Badge variant="outline">{product.category}</Badge>
            <Badge variant="outline">{product.scenario_type.replace(/_/g, " ")}</Badge>
          </DialogDescription>
        </DialogHeader>
        <Separator />

        <div className="space-y-4">
          {product.description && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">
                Description
              </h4>
              <p className="text-sm text-foreground/90 leading-relaxed">
                {product.description}
              </p>
            </div>
          )}

          {Object.keys(product.config).length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                Configuration
              </h4>
              <div className="bg-surface-elevated rounded-md p-3 text-xs font-mono text-foreground/80 overflow-x-auto">
                <pre>{JSON.stringify(product.config, null, 2)}</pre>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {product.is_template && (
              <Badge variant="success" className="text-[10px]">
                Template
              </Badge>
            )}
            {!product.is_template && (
              <Badge variant="muted" className="text-[10px]">
                Custom
              </Badge>
            )}
          </div>
        </div>

        <Separator />

        <div className="flex gap-2">
          <Button asChild className="flex-1" size="sm">
            <a href={`/simulations?product=${product.id}`}>
              Use in simulation
            </a>
          </Button>
          {!product.is_template && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="size-4" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
