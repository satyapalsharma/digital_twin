"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { RotateCcw } from "lucide-react";
import {
  CLAIMS_HISTORIES,
  DEFAULT_FILTER,
  FilterState,
  GENDERS,
  MARITAL_STATUSES,
  OCCUPATIONS,
  REGIONS,
  RISK_TOLERANCES,
} from "@/lib/audience-options";
import { formatCurrency, formatNumber } from "@/lib/utils";

interface Props {
  value: FilterState;
  onChange: (next: FilterState) => void;
  /** Region/occupation options derived from the live pool (/personas/facets).
   *  Falls back to the static lists when facets aren't loaded yet. */
  regionOptions?: readonly string[];
  occupationOptions?: readonly string[];
}

function toggle<T extends string>(arr: T[], v: T): T[] {
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
}

export function FilterPanel({ value, onChange, regionOptions, occupationOptions }: Props) {
  const regions = regionOptions?.length ? regionOptions : REGIONS;
  const occupations = occupationOptions?.length ? occupationOptions : OCCUPATIONS;
  const set = useMemo(() => {
    return <K extends keyof FilterState>(key: K, v: FilterState[K]) =>
      onChange({ ...value, [key]: v });
  }, [value, onChange]);

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Filters</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onChange(DEFAULT_FILTER)}
          className="text-xs"
        >
          <RotateCcw className="size-3" />
          Reset
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Age */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Age</span>
            <span className="text-muted-foreground tabular-nums">
              {value.age[0]} – {value.age[1]}
            </span>
          </div>
          <Slider
            min={18}
            max={90}
            step={1}
            value={value.age}
            onValueChange={(v) => set("age", [v[0], v[1]] as [number, number])}
          />
        </div>

        {/* Income */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Annual income</span>
            <span className="text-muted-foreground tabular-nums">
              {formatCurrency(value.income[0])} – {formatCurrency(value.income[1])}
            </span>
          </div>
          <Slider
            min={0}
            max={500000}
            step={5000}
            value={value.income}
            onValueChange={(v) => set("income", [v[0], v[1]] as [number, number])}
          />
        </div>

        <Separator />

        {/* Risk tolerance */}
        <ChipGroup
          label="Risk tolerance"
          options={RISK_TOLERANCES}
          selected={value.risk}
          onToggle={(v) => set("risk", toggle(value.risk, v))}
        />

        {/* Claims history */}
        <ChipGroup
          label="Claims history"
          options={CLAIMS_HISTORIES}
          selected={value.claims}
          onToggle={(v) => set("claims", toggle(value.claims, v))}
        />

        {/* Marital status */}
        <ChipGroup
          label="Marital status"
          options={MARITAL_STATUSES}
          selected={value.marital}
          onToggle={(v) => set("marital", toggle(value.marital, v))}
        />

        {/* Gender */}
        <ChipGroup
          label="Gender"
          options={GENDERS}
          selected={value.genders}
          onToggle={(v) => set("genders", toggle(value.genders, v))}
        />

        <Separator />

        {/* Regions */}
        <ChipGroup
          label="Regions"
          options={regions}
          selected={value.regions}
          onToggle={(v) => set("regions", toggle(value.regions, v))}
          size="sm"
        />

        {/* Occupations */}
        <ChipGroup
          label="Occupations"
          options={occupations}
          selected={value.occupations}
          onToggle={(v) => set("occupations", toggle(value.occupations, v))}
          size="sm"
        />

        <Separator />

        {/* Dependents */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Minimum dependents</label>
          <Input
            type="number"
            min={0}
            max={6}
            value={value.dependentsMin}
            onChange={(e) => set("dependentsMin", Number(e.target.value) || 0)}
            className="w-24"
          />
        </div>
      </CardContent>
    </Card>
  );
}

interface ChipGroupProps {
  label: string;
  options: readonly string[];
  selected: string[];
  onToggle: (v: string) => void;
  size?: "sm" | "md";
}

function ChipGroup({ label, options, selected, onToggle, size = "md" }: ChipGroupProps) {
  const niceLabel = (v: string) =>
    v.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        {selected.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {formatNumber(selected.length)} selected
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <Chip
            key={opt}
            size={size}
            active={selected.includes(opt)}
            onToggle={() => onToggle(opt)}
          >
            {niceLabel(opt)}
          </Chip>
        ))}
      </div>
    </div>
  );
}
