"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChipProps {
  active: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  size?: "sm" | "md";
}

export function Chip({ active, onToggle, children, size = "md" }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border transition-all cursor-pointer",
        size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm",
        active
          ? "border-primary bg-primary/10 text-primary font-medium"
          : "border-border bg-surface text-foreground/80 hover:bg-muted hover:border-muted-foreground/40"
      )}
    >
      {active && <Check className={size === "sm" ? "size-3" : "size-3.5"} />}
      {children}
    </button>
  );
}
