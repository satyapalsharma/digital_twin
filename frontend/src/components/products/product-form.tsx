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

interface ProductFormProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
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

export function ProductForm({ isOpen: controlledOpen, onOpenChange }: ProductFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    category: "Home",
    scenario_type: "custom" as const,
    description: "",
  });
  const qc = useQueryClient();

  const isOpen = controlledOpen ?? open;
  const setIsOpen = onOpenChange ?? setOpen;

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Product name is required");
      return;
    }
    setLoading(true);
    try {
      await api.post("/products", {
        ...formData,
        is_template: false,
        config: {},
      });
      toast.success("Product created successfully");
      qc.invalidateQueries({ queryKey: ["products"] });
      setFormData({
        name: "",
        category: "Home",
        scenario_type: "custom",
        description: "",
      });
      setIsOpen(false);
    } catch (error) {
      toast.error(`Failed to create product: ${String(error).slice(0, 100)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="size-4" />
          Add custom product
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create custom product</DialogTitle>
          <DialogDescription>
            Define a new product scenario to test with your audiences.
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
              {loading ? "Creating..." : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
