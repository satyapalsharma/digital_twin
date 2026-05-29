"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Users,
  Filter,
  Package,
  PlayCircle,
  LineChart,
  ClipboardList,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";

const nav = [
  { href: "/personas", label: "Personas", icon: Users },
  { href: "/audiences", label: "Audiences", icon: Filter },
  { href: "/products", label: "Products", icon: Package },
  { href: "/surveys", label: "Surveys", icon: ClipboardList },
  { href: "/simulations", label: "Simulations", icon: PlayCircle },
  { href: "/insights", label: "Insights", icon: LineChart },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 shrink-0 border-r border-border bg-surface flex flex-col">
      <Link
        href="/"
        className="flex items-center gap-2 px-5 h-16 border-b border-border"
      >
        <div className="size-8 rounded-lg bg-primary text-primary-foreground grid place-items-center shadow-sm">
          <Shield className="size-4" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold tracking-tight">
            Simulation
          </span>
          <span className="text-sm font-semibold tracking-tight text-primary">
            Sentinels
          </span>
        </div>
      </Link>

      <nav className="flex-1 p-3 space-y-1 text-sm">
        {nav.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                active
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-foreground/80 hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            <p>Hackathon build · v0.1</p>
            <p className="text-foreground/60 mt-0.5">Insurance vertical</p>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}
