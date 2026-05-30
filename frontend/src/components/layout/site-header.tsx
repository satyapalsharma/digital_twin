"use client";

import { useState } from "react";
import Link from "next/link";
import { Shield, Menu, X, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

const MENU: { href: string; label: string; route?: boolean }[] = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#scenarios", label: "Scenarios" },
  { href: "/#features", label: "Features" },
  { href: "/simulations", label: "Dashboard", route: true },
];

export function SiteHeader() {
  const { isAuthenticated, user, requestSignIn, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between gap-4">
        {/* Branding */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="size-8 rounded-lg bg-primary text-primary-foreground grid place-items-center shadow-sm">
            <Shield className="size-4" />
          </div>
          <span className="font-semibold tracking-tight hidden sm:inline">
            Simulation <span className="text-primary">Sentinels</span>
          </span>
        </Link>

        {/* Center menu */}
        <nav className="hidden md:flex items-center gap-7 text-sm text-muted-foreground">
          {MENU.map((item) =>
            item.route ? (
              <Link
                key={item.href}
                href={item.href}
                className="hover:text-foreground transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <a
                key={item.href}
                href={item.href}
                className="hover:text-foreground transition-colors"
              >
                {item.label}
              </a>
            )
          )}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <ThemeToggle />

          {isAuthenticated ? (
            <>
              <span
                className="hidden lg:grid size-8 place-items-center rounded-full bg-primary/15 text-primary text-xs font-semibold"
                title={`${user?.name} · ${user?.email}`}
              >
                {user?.name
                  ?.split(" ")
                  .map((p) => p[0])
                  .join("")
                  .slice(0, 2)}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={signOut}
                title="Sign out"
              >
                <LogOut className="size-4" />
                <span className="hidden sm:inline">Sign out</span>
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="hidden sm:inline-flex"
                onClick={() => requestSignIn("/simulations")}
              >
                Sign in
              </Button>
              <Button size="sm" onClick={() => requestSignIn("/simulations")}>
                Run simulation
              </Button>
            </>
          )}

          {/* Mobile menu toggle */}
          <button
            type="button"
            className="md:hidden size-9 grid place-items-center rounded-md hover:bg-muted text-foreground cursor-pointer"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu panel */}
      <div
        className={cn(
          "md:hidden border-t border-border bg-background overflow-hidden transition-all",
          mobileOpen ? "max-h-64" : "max-h-0 border-t-0"
        )}
      >
        <nav className="px-6 py-3 flex flex-col gap-1 text-sm">
          {MENU.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className="py-2 text-foreground/80 hover:text-primary transition-colors"
            >
              {item.label}
            </a>
          ))}
          {!isAuthenticated && (
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                requestSignIn("/simulations");
              }}
              className="py-2 text-left text-foreground/80 hover:text-primary transition-colors"
            >
              Sign in
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
