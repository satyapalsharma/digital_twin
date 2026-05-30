"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Sidebar } from "./sidebar";
import { SiteFooter } from "./site-footer";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [navOpen, setNavOpen] = useState(false);
  const pathname = usePathname();

  // Close the mobile drawer whenever the route changes. Render-time sync (see
  // react.dev "storing info from previous renders") avoids a setState-in-effect.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    if (navOpen) setNavOpen(false);
  }

  // Close on Escape while the drawer is open.
  useEffect(() => {
    if (!navOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setNavOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navOpen]);

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Desktop: persistent sidebar */}
      <Sidebar className="hidden md:flex" />

      {/* Mobile: slide-in drawer */}
      {navOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setNavOpen(false)}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          <Sidebar
            onNavigate={() => setNavOpen(false)}
            className="absolute left-0 top-0 h-full shadow-xl animate-in slide-in-from-left duration-200"
          />
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar with the menu toggle (hidden on md+) */}
        <header className="md:hidden flex items-center gap-3 h-14 px-4 border-b border-border bg-surface shrink-0">
          <button
            type="button"
            onClick={() => setNavOpen(true)}
            aria-label="Open navigation"
            aria-expanded={navOpen}
            className="grid place-items-center size-9 -ml-1.5 rounded-md text-foreground/80 hover:bg-muted hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer"
          >
            <Menu className="size-5" />
          </button>
          <Link href="/" className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/EXL_logo.svg" alt="EXL" className="h-5 w-auto" />
            <span className="text-base leading-none font-semibold tracking-tight text-primary whitespace-nowrap">
              CX Digital Twin
            </span>
          </Link>
        </header>

        <main className="flex-1 overflow-y-auto bg-background flex flex-col">
          <div className="flex-1">{children}</div>
          <SiteFooter />
        </main>
      </div>
    </div>
  );
}
