import { Suspense } from "react";
import { NewSimulationForm } from "@/components/simulations/new-simulation-form";
import { SimulationsList } from "@/components/simulations/simulations-list";

export default function SimulationsPage() {
  return (
    <div className="px-8 py-10 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Simulations</h1>
        <p className="text-muted-foreground mt-1">
          Pick an audience, a product, and run. We fan out parallel agents and
          stream progress live.
        </p>
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
