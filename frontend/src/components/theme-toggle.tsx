"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: "light", icon: Sun, label: "Light" },
  { value: "system", icon: Monitor, label: "System" },
  { value: "dark", icon: Moon, label: "Dark" },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="rounded-full border border-border p-0.5 bg-surface inline-flex">
      {OPTIONS.map((opt) => {
        const Icon = opt.icon;
        const active = mounted && theme === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => setTheme(opt.value)}
            className={cn(
              "size-7 grid place-items-center rounded-full transition-colors cursor-pointer",
              active
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
            aria-label={`${opt.label} theme`}
            title={opt.label}
          >
            <Icon className="size-3.5" />
          </button>
        );
      })}
    </div>
  );
}
