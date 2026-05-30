"use client";

import {
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Users,
  Zap,
  AlertTriangle,
  Boxes,
  MessagesSquare,
  Gauge,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";

const scenarios = [
  {
    name: "Premium hike",
    blurb: "12% increase on auto policies for high-claim ZIPs",
    category: "Pricing",
    icon: TrendingUp,
  },
  {
    name: "Natural-disaster rider",
    blurb: "2× life payout for disasters, $8/mo",
    category: "Product",
    icon: ShieldCheck,
  },
  {
    name: "Value-back program",
    blurb: "5% premium refund for 30-day active app usage",
    category: "Retention",
    icon: Zap,
  },
  {
    name: "Telematics opt-in",
    blurb: "15% discount for sharing trip data",
    category: "Channel",
    icon: TrendingUp,
  },
  {
    name: "Home + Auto bundle",
    blurb: "10% combined-policy discount",
    category: "Cross-sell",
    icon: Users,
  },
  {
    name: "Claims UX overhaul",
    blurb: "Self-service mobile claims flow",
    category: "Experience",
    icon: AlertTriangle,
  },
];

const stats = [
  { label: "Synthetic customers", value: "500+" },
  { label: "Pre-built scenarios", value: "10" },
  { label: "Time per simulation", value: "~60s" },
  { label: "Cost per run", value: "~$0.12" },
];

const features = [
  {
    icon: Users,
    title: "AI-twin persona pool",
    body: "Hundreds of synthetic customers with realistic demographics, policies, risk tolerance, and concerns — segment them into audiences in a click.",
  },
  {
    icon: MessagesSquare,
    title: "Surveys & focus-group debates",
    body: "Run a structured survey or a multi-agent debate where personas argue, react, and reveal the why behind their choices.",
  },
  {
    icon: Gauge,
    title: "Launch / Optimize / Halt verdict",
    body: "Every run returns a clear verdict with segment breakdowns, diverging personas, and the reasoning behind each recommendation.",
  },
];

const steps = [
  {
    icon: Boxes,
    title: "Pick a product & audience",
    body: "Choose a pre-built scenario or define your own, then target a cohort from the persona pool.",
  },
  {
    icon: MessagesSquare,
    title: "Run the simulation",
    body: "Personas respond to a survey or debate the concept in parallel — results stream in within about a minute.",
  },
  {
    icon: Gauge,
    title: "Read the verdict",
    body: "Get a Launch · Optimize · Halt call backed by insights, charts, and standout customer voices.",
  },
];

export default function HomePage() {
  const { requestSignIn } = useAuth();

  return (
    <div className="px-6 md:px-8">
      {/* Hero */}
      <section className="max-w-7xl mx-auto py-16 md:py-24 space-y-6">
        <Badge variant="muted" className="gap-1.5">
          <span className="size-1.5 rounded-full bg-primary animate-pulse" />
          Hackathon build · insurance vertical
        </Badge>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight max-w-3xl">
          Test a policy on{" "}
          <span className="text-primary">500+ AI-twin customers</span> before
          launching to real ones.
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          Simulation Sentinels spins up synthetic personas, runs your product
          through a survey or focus-group debate, and returns a{" "}
          <span className="font-medium text-foreground">
            Launch · Optimize · Halt
          </span>{" "}
          verdict with the reasoning behind every recommendation.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button size="lg" onClick={() => requestSignIn("/simulations")}>
            Run a simulation
            <ArrowRight className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => requestSignIn("/personas")}
          >
            Browse personas
          </Button>
        </div>
      </section>

      {/* Stats */}
      <section id="features" className="max-w-7xl mx-auto pb-16 scroll-mt-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s) => (
            <Card key={s.label} className="bg-surface-elevated border-0">
              <CardContent className="p-6">
                <div className="text-3xl font-bold text-primary">{s.value}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  {s.label}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-10">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <Card key={f.title}>
                <CardHeader>
                  <div className="size-10 rounded-lg bg-primary/10 text-primary grid place-items-center">
                    <Icon className="size-5" />
                  </div>
                  <CardTitle className="mt-3 text-base">{f.title}</CardTitle>
                  <CardDescription>{f.body}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="max-w-7xl mx-auto py-16 border-t border-border scroll-mt-20"
      >
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
          How it works
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          From idea to verdict in three steps.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <Card key={step.title} className="relative">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <span className="size-7 rounded-full bg-primary text-primary-foreground grid place-items-center text-sm font-semibold">
                      {i + 1}
                    </span>
                    <Icon className="size-5 text-primary" />
                  </div>
                  <CardTitle className="mt-3 text-base">{step.title}</CardTitle>
                  <CardDescription>{step.body}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Scenario gallery */}
      <section
        id="scenarios"
        className="max-w-7xl mx-auto py-16 border-t border-border scroll-mt-20"
      >
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
              Scenario gallery
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              One-click test cases — or roll your own.
            </p>
          </div>
          <Button variant="ghost" onClick={() => requestSignIn("/products")}>
            View all <ArrowRight className="size-4" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {scenarios.map((s) => {
            const Icon = s.icon;
            return (
              <Card
                key={s.name}
                onClick={() => requestSignIn("/simulations")}
                className="hover:border-primary/40 hover:shadow-md transition-all cursor-pointer group"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="size-10 rounded-lg bg-primary/10 text-primary grid place-items-center">
                      <Icon className="size-5" />
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {s.category}
                    </Badge>
                  </div>
                  <CardTitle className="mt-3 text-base">{s.name}</CardTitle>
                  <CardDescription>{s.blurb}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    Run with audience <ArrowRight className="size-3.5" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* CTA band */}
      <section className="max-w-7xl mx-auto pb-20">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">
                Ready to pressure-test your next product?
              </h2>
              <p className="text-muted-foreground mt-1">
                Sign in with SSO and run your first simulation in under a minute.
              </p>
            </div>
            <Button
              size="lg"
              className="shrink-0"
              onClick={() => requestSignIn("/simulations")}
            >
              Run simulation
              <ArrowRight className="size-4" />
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
