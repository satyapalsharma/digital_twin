"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { useState } from "react";
import { AuthProvider } from "@/lib/auth";
import { SsoDialog } from "@/components/auth/sso-dialog";

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, refetchOnWindowFocus: false },
        },
      })
  );
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <QueryClientProvider client={client}>
        <AuthProvider>
          {children}
          {/* Mimic-SSO dialog is mounted once, globally, and opened via useAuth(). */}
          <SsoDialog />
        </AuthProvider>
        <Toaster position="top-right" richColors closeButton theme="system" />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
