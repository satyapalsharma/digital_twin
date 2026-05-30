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
  LayoutDashboard,
  Home,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { DemoControls } from "@/components/layout/demo-controls";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/lib/auth";

const nav = [
  { href: "/overview", label: "Overview", icon: LayoutDashboard },
  { href: "/personas", label: "Personas", icon: Users },
  { href: "/audiences", label: "Audiences", icon: Filter },
  { href: "/products", label: "Products", icon: Package },
  { href: "/surveys", label: "Surveys", icon: ClipboardList },
  { href: "/simulations", label: "Simulations", icon: PlayCircle },
  { href: "/insights", label: "Insights", icon: LineChart },
];

interface SidebarProps {
  /** Called after any navigation/action — lets the mobile drawer close itself. */
  onNavigate?: () => void;
  className?: string;
}

export function Sidebar({ onNavigate, className }: SidebarProps) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const initials = user?.name
    ?.split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2);

  return (
    <aside
      className={cn(
        "w-60 shrink-0 border-r border-border bg-surface flex flex-col",
        className
      )}
    >
      <Link
        href="/"
        onClick={onNavigate}
        className="flex items-center gap-2 px-5 h-16 border-b border-border"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/EXL_logo.svg" alt="EXL" className="h-5 w-auto" />
        <span className="text-base leading-none font-semibold tracking-tight text-primary whitespace-nowrap">
          CX Digital Twin
        </span>
      </Link>

      <nav className="flex-1 p-3 space-y-1 text-sm">
        {nav.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
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

      <div className="p-3 border-t border-border space-y-1.5">
        {user && (
          <div className="flex items-center gap-2 px-1 pb-1">
            <span className="size-7 shrink-0 grid place-items-center rounded-full bg-primary/15 text-primary text-[11px] font-semibold">
              {initials}
            </span>
            <div className="min-w-0">
              <p className="text-xs font-medium truncate">{user.name}</p>
              <p className="text-[11px] text-muted-foreground truncate">
                {user.email}
              </p>
            </div>
          </div>
        )}

        <Link
          href="/"
          onClick={onNavigate}
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-foreground/80 hover:bg-muted hover:text-foreground transition-colors"
        >
          <Home className="size-4" />
          Back to home
        </Link>
        <button
          type="button"
          onClick={() => {
            onNavigate?.();
            signOut();
          }}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-foreground/80 hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
        >
          <LogOut className="size-4" />
          Sign out
        </button>

        <Separator className="my-1.5" />
        <DemoControls />

        <div className="flex items-center justify-end pt-1.5">
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}
