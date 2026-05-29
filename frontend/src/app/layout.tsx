import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import NextTopLoader from "nextjs-toploader";
import "./globals.css";
import { Providers } from "@/components/providers";
import { AppShell } from "@/components/layout/app-shell";
import { CommandPalette } from "@/components/command-palette";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Simulation Sentinels",
  description:
    "Test insurance products against AI-twin customer personas. Get a Launch / Optimize / Halt verdict before going to market.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full">
        <Providers>
          <NextTopLoader
            color="hsl(var(--primary))"
            height={2}
            showSpinner={false}
            shadow={false}
            crawl
          />
          <AppShell>{children}</AppShell>
          <CommandPalette />
        </Providers>
      </body>
    </html>
  );
}
