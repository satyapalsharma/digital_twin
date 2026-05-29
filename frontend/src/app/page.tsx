import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Users,
  Zap,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
  { label: "Synthetic customers", value: "1,700+" },
  { label: "Pre-built scenarios", value: "10" },
  { label: "Time per simulation", value: "~60s" },
  { label: "Cost per run", value: "~$0.12" },
];

export default function HomePage() {
  return (
    <div className="px-8 py-10 max-w-7xl mx-auto space-y-10">
      <section className="space-y-6">
        <Badge variant="muted" className="gap-1.5">
          <span className="size-1.5 rounded-full bg-primary animate-pulse" />
          Hackathon build · insurance vertical
        </Badge>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight max-w-3xl">
          Test a policy on{" "}
          <span className="text-primary">1,500 AI-twin customers</span> before
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
        <div className="flex gap-3">
          <Button asChild size="lg">
            <Link href="/simulations">
              Run a simulation
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/personas">Browse personas</Link>
          </Button>
        </div>
      </section>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="bg-surface-elevated border-0">
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-primary">{s.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </section>

      <section>
        <div className="flex items-end justify-between mb-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              Scenario gallery
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              One-click test cases — or roll your own.
            </p>
          </div>
          <Button asChild variant="ghost">
            <Link href="/products">
              View all <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {scenarios.map((s) => {
            const Icon = s.icon;
            return (
              <Card
                key={s.name}
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
    </div>
  );
}
