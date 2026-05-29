"use client";

import { cn } from "@/lib/utils";

// 14 hand-tuned warm/cool gradient pairs. Sticking with two-stop gradients
// keeps avatars readable when initials are overlaid.
const GRADIENTS: [string, string][] = [
  ["#FFB17A", "#FF6B6B"],
  ["#FDB99B", "#CF8BF3"],
  ["#A8E063", "#56AB2F"],
  ["#56CCF2", "#2F80ED"],
  ["#F093FB", "#F5576C"],
  ["#4FACFE", "#00F2FE"],
  ["#FBC2EB", "#A18CD1"],
  ["#FAD961", "#F76B1C"],
  ["#A1FFCE", "#FAFFD1"],
  ["#FFA17F", "#00223E"],
  ["#FF9A8B", "#FF6A88"],
  ["#7F7FD5", "#86A8E7"],
  ["#43E97B", "#38F9D7"],
  ["#FCCB90", "#D57EEB"],
];

// Stable hash so same id always gets same gradient
function hashId(id: number | string): number {
  if (typeof id === "number") return id;
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

export function gradientFor(id: number | string) {
  const [a, b] = GRADIENTS[hashId(id) % GRADIENTS.length];
  return `linear-gradient(135deg, ${a} 0%, ${b} 100%)`;
}

export function initialsOf(name?: string | null): string {
  if (!name) return "??";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("") || "?";
}

interface AvatarProps {
  id: number | string;
  name?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  ring?: boolean;
}

const SIZE = {
  xs: "size-6 text-[9px]",
  sm: "size-7 text-[10px]",
  md: "size-9 text-xs",
  lg: "size-12 text-base",
  xl: "size-16 text-lg",
} as const;

export function PersonaAvatar({ id, name, size = "md", className, ring }: AvatarProps) {
  return (
    <div
      className={cn(
        "rounded-full grid place-items-center font-semibold text-white shrink-0 select-none",
        SIZE[size],
        ring && "ring-2 ring-offset-1 ring-offset-background ring-white/30",
        className
      )}
      style={{
        background: gradientFor(id),
        textShadow: "0 1px 2px rgba(0,0,0,0.25)",
      }}
      aria-label={name ?? `persona ${id}`}
    >
      {initialsOf(name)}
    </div>
  );
}
