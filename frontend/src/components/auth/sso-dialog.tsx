"use client";

import { useState } from "react";
import { Loader2, ShieldCheck, Lock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth, type AuthUser } from "@/lib/auth";
import { cn } from "@/lib/utils";

interface Provider {
  id: string;
  label: string;
  glyph: string;
  /** The demo identity returned when "authenticating" with this provider. */
  user: AuthUser;
}

const PROVIDERS: Provider[] = [
  {
    id: "okta",
    label: "Continue with Okta",
    glyph: "O",
    user: {
      name: "Alex Morgan",
      email: "alex.morgan@acme-insure.com",
      provider: "Okta",
    },
  },
  {
    id: "google",
    label: "Continue with Google Workspace",
    glyph: "G",
    user: {
      name: "Alex Morgan",
      email: "alex.morgan@acme-insure.com",
      provider: "Google Workspace",
    },
  },
  {
    id: "azure",
    label: "Continue with Microsoft Entra ID",
    glyph: "M",
    user: {
      name: "Alex Morgan",
      email: "alex.morgan@acme-insure.com",
      provider: "Microsoft Entra ID",
    },
  },
];

export function SsoDialog() {
  const { ssoOpen, setSsoOpen, completeSignIn } = useAuth();
  const [pending, setPending] = useState<string | null>(null);

  function authenticate(provider: Provider) {
    if (pending) return;
    setPending(provider.id);
    // Mimic the SSO round-trip latency, then "sign in" and route to dashboard.
    setTimeout(() => {
      completeSignIn(provider.user);
      setPending(null);
    }, 1300);
  }

  return (
    <Dialog
      open={ssoOpen}
      onOpenChange={(open) => {
        if (pending) return; // don't allow closing mid-auth
        setSsoOpen(open);
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader className="items-center text-center pr-0">
          <div className="size-12 rounded-xl bg-primary text-primary-foreground grid place-items-center shadow-sm mx-auto mb-2">
            <ShieldCheck className="size-6" />
          </div>
          <DialogTitle className="text-center">
            Sign in to Simulation Sentinels
          </DialogTitle>
          <DialogDescription className="text-center">
            Use your organization&apos;s single sign-on to continue to the
            dashboard.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2.5 mt-2">
          {PROVIDERS.map((provider) => {
            const isPending = pending === provider.id;
            return (
              <button
                key={provider.id}
                type="button"
                onClick={() => authenticate(provider)}
                disabled={!!pending}
                className={cn(
                  "w-full flex items-center gap-3 h-11 px-4 rounded-md border border-border bg-surface text-sm font-medium transition-colors",
                  "hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  "disabled:opacity-60 disabled:pointer-events-none cursor-pointer"
                )}
              >
                <span className="size-6 shrink-0 grid place-items-center rounded bg-muted text-foreground font-semibold text-xs">
                  {provider.glyph}
                </span>
                <span className="flex-1 text-left">
                  {isPending ? `Authenticating with ${provider.user.provider}…` : provider.label}
                </span>
                {isPending && (
                  <Loader2 className="size-4 animate-spin text-primary" />
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground mt-1">
          <Lock className="size-3" />
          <span>Demo SSO — no real credentials required</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
