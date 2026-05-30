"use client";

import { createElement, useState } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/layout/states";
import { api } from "@/lib/api";
import { ProductForm } from "@/components/products/product-form";
import { ProductDetailDialog } from "@/components/products/product-detail-dialog";
import { headlineChip, scenarioMeta } from "@/lib/product-meta";

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
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const { data, isLoading, isError, error, refetch } = useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: () => api.get<Product[]>("/products"),
  });

  const products = data ?? [];
  const templates = products.filter((p) => p.is_template);
  const custom = products.filter((p) => !p.is_template);

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setDetailOpen(true);
  };

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
        <ProductForm />
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full rounded-xl" />
          ))}
        </div>
      )}

      {isError && (
        <ErrorState description={String(error)} onRetry={() => refetch()} />
      )}

      {!isLoading && !isError && products.length === 0 && (
        <EmptyState
          icon={Package}
          title="No products yet"
          description="Add a custom product scenario to start testing it against your audiences."
          action={<ProductForm />}
        />
      )}

      {!isLoading && !isError && products.length > 0 && (
        <>
          <section className="space-y-3">
            <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2">
              Pre-built scenarios
              <Badge variant="muted">{templates.length}</Badge>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onClick={() => handleProductClick(p)}
                />
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
                  <ProductCard
                    key={p.id}
                    product={p}
                    onClick={() => handleProductClick(p)}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <ProductDetailDialog
        product={selectedProduct}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onEdit={(id) => {
          const p = products.find((x) => x.id === id) ?? null;
          setDetailOpen(false);
          setEditProduct(p);
          setEditOpen(true);
        }}
      />

      <ProductForm
        product={editProduct}
        isOpen={editOpen}
        onOpenChange={setEditOpen}
        showTrigger={false}
      />
    </div>
  );
}

function ProductCard({ product, onClick }: { product: Product; onClick: () => void }) {
  const icon = iconFor(product);
  const meta = scenarioMeta(product.scenario_type);
  const chip = headlineChip(product.scenario_type, product.config ?? {});
  return (
    <Card
      className="group hover:border-primary/40 hover:shadow-md transition-all flex flex-col cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`View ${product.name} — ${meta.label}`}
    >
      <CardHeader className="flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="size-10 rounded-lg bg-primary/10 text-primary grid place-items-center">
            {createElement(icon, { className: "size-5" })}
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge variant="outline" className="text-xs">
              {product.category}
            </Badge>
            <span className="text-[10px] text-muted-foreground">{meta.label}</span>
          </div>
        </div>
        <CardTitle className="mt-3 text-base">{product.name}</CardTitle>
        <CardDescription className="line-clamp-3">
          {product.description || meta.summary}
        </CardDescription>
        {chip && (
          <div className="pt-1">
            <Badge variant="secondary" className="font-medium">{chip}</Badge>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <Button asChild variant="ghost" size="sm" className="w-full justify-between">
          <Link href={`/simulations?product=${product.id}`} onClick={(e) => e.stopPropagation()}>
            Run with audience
            <ArrowRight className="size-3.5" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
