"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FilterPanel } from "@/components/audience/filter-panel";
import { CohortPreview } from "@/components/audience/cohort-preview";
import { SaveBar } from "@/components/audience/save-bar";
import { SavedAudiences } from "@/components/audience/saved-list";
import { api } from "@/lib/api";
import {
  DEFAULT_FILTER,
  FilterState,
  toApiPayload,
} from "@/lib/audience-options";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

interface PreviewResponse {
  total: number;
  sample: {
    id: number;
    name: string;
    age: number;
    occupation: string;
    income: number;
    region: string;
    risk_tolerance: string;
  }[];
}

export default function AudiencesPage() {
  const [filter, setFilter] = useState<FilterState>(DEFAULT_FILTER);
  const [savedRefresh, setSavedRefresh] = useState(0);

  const debounced = useDebouncedValue(filter, 250);
  const payload = useMemo(() => toApiPayload(debounced), [debounced]);

  const { data, isFetching } = useQuery<PreviewResponse>({
    queryKey: ["audience-preview", payload],
    queryFn: () => api.post<PreviewResponse>("/personas/filter/preview", payload),
  });

  return (
    <div className="px-8 py-10 max-w-7xl mx-auto space-y-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Audiences</h1>
        <p className="text-muted-foreground">
          Compose customer cohorts from the persona pool. Counts update live.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        <FilterPanel value={filter} onChange={setFilter} />
        <CohortPreview
          total={data?.total}
          sample={data?.sample ?? []}
          loading={isFetching}
        />
      </div>

      <SaveBar
        filter={filter}
        total={data?.total}
        onSaved={() => setSavedRefresh((n) => n + 1)}
      />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">Saved audiences</h2>
        <SavedAudiences refreshKey={savedRefresh} />
      </section>
    </div>
  );
}
