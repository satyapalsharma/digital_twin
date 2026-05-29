"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  Filter,
  Package,
  PlayCircle,
  LineChart,
  ClipboardList,
  Plus,
  Sparkles,
  Search,
} from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Audience {
  id: number;
  name: string;
  persona_ids: number[];
}
interface Simulation {
  id: number;
  name: string;
  status: string;
  mode: string;
}
interface Product {
  id: number;
  name: string;
  category: string;
}

const PAGES = [
  { href: "/", label: "Home", icon: Sparkles, keywords: "dashboard landing" },
  { href: "/personas", label: "Personas", icon: Users, keywords: "customers people pool" },
  { href: "/audiences", label: "Audiences", icon: Filter, keywords: "cohorts segments filter" },
  { href: "/products", label: "Products & scenarios", icon: Package, keywords: "scenarios insurance offerings" },
  { href: "/surveys", label: "Surveys", icon: ClipboardList, keywords: "questions questionnaire" },
  { href: "/simulations", label: "Simulations", icon: PlayCircle, keywords: "runs tests" },
  { href: "/insights", label: "Insights", icon: LineChart, keywords: "verdicts results dashboard" },
];

const ACTIONS = [
  { href: "/simulations", label: "New simulation", icon: Plus, keywords: "run start test" },
  { href: "/surveys/new", label: "New survey", icon: Plus, keywords: "create build questions" },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Lazy-load lists only when palette opens
  const audiences = useQuery({
    queryKey: ["audiences"],
    queryFn: () => api.get<Audience[]>("/audiences"),
    enabled: open,
  });
  const sims = useQuery({
    queryKey: ["simulations"],
    queryFn: () => api.get<Simulation[]>("/simulations"),
    enabled: open,
  });
  const products = useQuery({
    queryKey: ["products"],
    queryFn: () => api.get<Product[]>("/products"),
    enabled: open,
  });

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center pt-24 px-4 animate-in fade-in-0"
      onClick={() => setOpen(false)}
    >
      <Command
        className="w-full max-w-xl bg-popover border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[60vh]"
        onClick={(e) => e.stopPropagation()}
        loop
      >
        <div className="flex items-center gap-2 px-4 border-b border-border">
          <Search className="size-4 text-muted-foreground shrink-0" />
          <Command.Input
            placeholder="Type a command, jump to a page, or search..."
            className="flex-1 h-12 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            autoFocus
          />
          <kbd className="hidden md:inline-flex h-5 px-1.5 items-center text-[10px] font-mono rounded border border-border bg-muted text-muted-foreground">
            esc
          </kbd>
        </div>
        <Command.List className="overflow-y-auto p-2 flex-1">
          <Command.Empty className="px-3 py-8 text-sm text-muted-foreground text-center">
            No matches found.
          </Command.Empty>

          <Command.Group heading="Pages" className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 py-1.5">
            {PAGES.map((p) => (
              <Item
                key={p.href}
                onSelect={() => go(p.href)}
                icon={<p.icon className="size-4" />}
                label={p.label}
                keywords={p.keywords}
              />
            ))}
          </Command.Group>

          <Command.Group heading="Actions" className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 py-1.5">
            {ACTIONS.map((a) => (
              <Item
                key={a.label}
                onSelect={() => go(a.href)}
                icon={<a.icon className="size-4 text-primary" />}
                label={a.label}
                keywords={a.keywords}
              />
            ))}
          </Command.Group>

          {(audiences.data ?? []).length > 0 && (
            <Command.Group heading="Audiences" className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 py-1.5">
              {audiences.data!.map((a) => (
                <Item
                  key={a.id}
                  onSelect={() => go(`/audiences`)}
                  icon={<Filter className="size-4 text-muted-foreground" />}
                  label={a.name}
                  detail={`${a.persona_ids.length} personas`}
                />
              ))}
            </Command.Group>
          )}

          {(products.data ?? []).length > 0 && (
            <Command.Group heading="Products" className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 py-1.5">
              {products.data!.slice(0, 8).map((p) => (
                <Item
                  key={p.id}
                  onSelect={() => go(`/simulations?product=${p.id}`)}
                  icon={<Package className="size-4 text-muted-foreground" />}
                  label={p.name}
                  detail={p.category}
                />
              ))}
            </Command.Group>
          )}

          {(sims.data ?? []).length > 0 && (
            <Command.Group heading="Recent simulations" className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 py-1.5">
              {sims.data!.slice(0, 5).map((s) => (
                <Item
                  key={s.id}
                  onSelect={() => go(s.status === "completed" ? `/insights/${s.id}` : `/simulations/${s.id}`)}
                  icon={<PlayCircle className="size-4 text-muted-foreground" />}
                  label={s.name}
                  detail={`${s.mode} · ${s.status}`}
                />
              ))}
            </Command.Group>
          )}
        </Command.List>
        <div className="border-t border-border px-3 py-2 flex items-center justify-between text-[10px] text-muted-foreground">
          <span>
            <kbd className="font-mono">↑↓</kbd> navigate <kbd className="font-mono ml-2">↵</kbd> select
          </span>
          <span>
            <kbd className="font-mono">⌘K</kbd> to toggle
          </span>
        </div>
      </Command>
    </div>
  );
}

function Item({
  onSelect,
  icon,
  label,
  detail,
  keywords,
}: {
  onSelect: () => void;
  icon: React.ReactNode;
  label: string;
  detail?: string;
  keywords?: string;
}) {
  return (
    <Command.Item
      onSelect={onSelect}
      value={`${label} ${keywords ?? ""} ${detail ?? ""}`}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer text-sm",
        "data-[selected=true]:bg-primary/10 data-[selected=true]:text-primary"
      )}
    >
      {icon}
      <span className="flex-1 truncate">{label}</span>
      {detail && (
        <span className="text-xs text-muted-foreground capitalize">{detail}</span>
      )}
    </Command.Item>
  );
}
