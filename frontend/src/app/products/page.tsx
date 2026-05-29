"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  TrendingUp,
  ShieldCheck,
  Zap,
  AlertTriangle,
  Package,
  Users,
  Home,
  PawPrint,
  Award,
  CloudRain,
  ArrowRight,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

interface Product {
  id: number;
  name: string;
  category: string;
  scenario_type: string;
  description: string;
  config: Record<string, unknown>;
  is_template: boolean;
}

const SCENARIO_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  premium_hike: TrendingUp,
  new_rider: ShieldCheck,
  value_back: Zap,
  telematics: TrendingUp,
  bundling: Users,
  claims_ux: AlertTriangle,
  discount_offer: Award,
};

const CATEGORY_ICON_FALLBACK: Record<string, React.ComponentType<{ className?: string }>> = {
  Home: Home,
  Pet: PawPrint,
  Retention: Award,
};

function iconFor(p: Product) {
  return (
    SCENARIO_ICON[p.scenario_type] ??
    CATEGORY_ICON_FALLBACK[p.category] ??
    Package
  );
}

export default function ProductsPage() {
  const { data, isLoading } = useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: () => api.get<Product[]>("/products"),
  });

  const products = data ?? [];
  const templates = products.filter((p) => p.is_template);
  const custom = products.filter((p) => !p.is_template);

  return (
    <div className="px-8 py-10 max-w-7xl mx-auto space-y-10">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products & Scenarios</h1>
          <p className="text-muted-foreground mt-1">
            One-click test scenarios drawn from common insurance launches —
            or roll your own.
          </p>
        </div>
        <Button disabled>
          + Custom product (soon)
        </Button>
      </div>

      {isLoading && (
        <p className="text-sm text-muted-foreground">Loading scenarios...</p>
      )}

      {!isLoading && (
        <>
          <section className="space-y-3">
            <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2">
              Pre-built scenarios
              <Badge variant="muted">{templates.length}</Badge>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>

          {custom.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2">
                Your custom products
                <Badge variant="muted">{custom.length}</Badge>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {custom.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  const Icon = iconFor(product);
  return (
    <Card className="group hover:border-primary/40 hover:shadow-md transition-all flex flex-col">
      <CardHeader className="flex-1">
        <div className="flex items-start justify-between">
          <div className="size-10 rounded-lg bg-primary/10 text-primary grid place-items-center">
            <Icon className="size-5" />
          </div>
          <Badge variant="outline" className="text-xs">
            {product.category}
          </Badge>
        </div>
        <CardTitle className="mt-3 text-base">{product.name}</CardTitle>
        <CardDescription className="line-clamp-3">
          {product.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild variant="ghost" size="sm" className="w-full justify-between">
          <Link href={`/simulations?product=${product.id}`}>
            Run with audience
            <ArrowRight className="size-3.5" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
