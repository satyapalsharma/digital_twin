"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { CommandPalette } from "@/components/command-palette";
import { useAuth } from "@/lib/auth";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { hydrated, isAuthenticated, requestSignIn } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Soft guard: once we know the auth state, bounce unauthenticated visitors
  // back to the landing page and open the SSO dialog with a redirect back here.
  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      router.replace("/");
      requestSignIn(pathname);
    }
  }, [hydrated, isAuthenticated, router, requestSignIn, pathname]);

  if (!hydrated || !isAuthenticated) {
    return (
      <div className="h-screen grid place-items-center bg-background text-muted-foreground">
        <div className="flex items-center gap-2 text-sm">
          <Loader2 className="size-4 animate-spin" />
          Checking your session…
        </div>
      </div>
    );
  }

  return (
    <>
      <AppShell>{children}</AppShell>
      <CommandPalette />
    </>
  );
}
