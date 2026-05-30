import { Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { NewSimulationForm } from "@/components/simulations/new-simulation-form";
import { SimulationsList } from "@/components/simulations/simulations-list";

export default function SimulationsPage() {
  return (
    <div className="px-8 py-10 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Simulations</h1>
          <p className="text-muted-foreground mt-1">
            Pick an audience, a product, and run. We fan out parallel agents and
            stream progress live.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/simulations/compare">Compare runs</Link>
        </Button>
      </div>

      <Suspense>
        <NewSimulationForm />
      </Suspense>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">Recent runs</h2>
        <SimulationsList />
      </section>
    </div>
  );
}
