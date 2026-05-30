// Product / scenario presentation metadata. Turns the free-form scenario_type +
// config blob (see backend/app/seed_data/scenarios.py) into a business-grade
// briefing for the product detail view — the lens a product manager would use.

export interface ScenarioMeta {
  label: string;
  // One-line "what this play is" for the exec audience.
  summary: string;
  // The customer-decision hypothesis we're testing in simulation.
  hypothesis: string;
  // KPIs a PM watches when this ships.
  kpis: string[];
  // The headline lever key(s) in config worth surfacing as a chip.
  headlineKeys: string[];
}

export const SCENARIO_META: Record<string, ScenarioMeta> = {
  premium_hike: {
    label: "Premium increase",
    summary: "Raise premiums on a targeted book and test churn vs. margin.",
    hypothesis: "Customers will accept a transparent, data-justified increase rather than shop around.",
    kpis: ["Voluntary churn %", "Net premium retained", "Complaint / NPS delta"],
    headlineKeys: ["price_change_pct", "policy_line", "notice_days"],
  },
  new_rider: {
    label: "New rider / coverage",
    summary: "Introduce optional coverage and gauge attach rate and willingness to pay.",
    hypothesis: "A clearly-scoped rider at a fair price drives incremental attach without cannibalizing core cover.",
    kpis: ["Attach rate %", "Incremental premium", "Adverse-selection signal"],
    headlineKeys: ["rider_cost_monthly", "payout_multiplier", "base_monthly"],
  },
  value_back: {
    label: "Value-back reward",
    summary: "Reward engaged customers with premium credit to lift retention.",
    hypothesis: "A modest, attainable reward measurably improves retention and engagement.",
    kpis: ["Retention lift %", "Reward redemption %", "Engagement frequency"],
    headlineKeys: ["reward_pct", "evaluation_period_days"],
  },
  telematics: {
    label: "Telematics / usage-based",
    summary: "Offer a data-sharing discount and measure opt-in and privacy resistance.",
    hypothesis: "Price-sensitive, tech-comfortable drivers will trade trip data for a meaningful discount.",
    kpis: ["Opt-in rate %", "Loss-ratio improvement", "Privacy objection rate"],
    headlineKeys: ["discount_pct", "minimum_period_days"],
  },
  bundling: {
    label: "Bundle / cross-sell",
    summary: "Discount multi-line customers to grow share-of-wallet and stickiness.",
    hypothesis: "A combined discount nudges single-line customers to add a second line at renewal.",
    kpis: ["Bundle take rate %", "Lines per customer", "Retention of bundled book"],
    headlineKeys: ["combined_discount_pct", "bundle_lines"],
  },
  claims_ux: {
    label: "Claims experience",
    summary: "Shift claims to a self-service mobile flow and test satisfaction vs. leakage.",
    hypothesis: "A guided digital flow raises satisfaction and speed without increasing claims cost.",
    kpis: ["CSAT / NPS", "Avg. cycle time", "Digital containment %"],
    headlineKeys: ["estimated_completion_time_min", "ai_triage"],
  },
  policy_renewal: {
    label: "Renewal play",
    summary: "Change the renewal offer or flow and test save-rate.",
    hypothesis: "A reframed renewal offer improves save-rate among at-risk customers.",
    kpis: ["Renewal save rate %", "Premium retained", "Downgrade rate"],
    headlineKeys: ["price_change_pct", "notice_days"],
  },
  discount_offer: {
    label: "Discount / acquisition offer",
    summary: "Run a promotional discount and test acquisition vs. margin dilution.",
    hypothesis: "A time-boxed discount drives acquisition that pays back over the customer lifetime.",
    kpis: ["Quote-to-bind %", "CAC payback", "Post-promo retention"],
    headlineKeys: ["discount_pct", "reward_pct"],
  },
  channel_change: {
    label: "Channel change",
    summary: "Move servicing or sales to a new channel and test adoption.",
    hypothesis: "Customers adopt the new channel without a drop in conversion or satisfaction.",
    kpis: ["Channel adoption %", "Conversion delta", "Servicing cost / policy"],
    headlineKeys: [],
  },
  custom: {
    label: "Custom scenario",
    summary: "A bespoke product or policy change to test against the audience.",
    hypothesis: "Define the customer-decision you expect this change to drive.",
    kpis: ["Acceptance / sentiment", "Segment divergence"],
    headlineKeys: [],
  },
};

export function scenarioMeta(scenarioType: string): ScenarioMeta {
  return SCENARIO_META[scenarioType] ?? SCENARIO_META.custom;
}

// ---- per-scenario config schema (typed, validated form fields) ----------

export interface ConfigField {
  key: string;
  label: string;
  type: "percent" | "currency" | "number" | "text" | "boolean";
  min?: number;
  max?: number;
  placeholder?: string;
}

// The config levers each scenario type expects. Drives typed inputs + validation
// in the product form, mirroring the shapes in backend/app/seed_data/scenarios.py.
export const SCENARIO_CONFIG_SCHEMA: Record<string, ConfigField[]> = {
  premium_hike: [
    { key: "price_change_pct", label: "Premium change", type: "percent", min: -50, max: 100, placeholder: "12" },
    { key: "policy_line", label: "Policy line", type: "text", placeholder: "auto" },
    { key: "notice_days", label: "Renewal notice", type: "number", min: 0, max: 365, placeholder: "60" },
  ],
  new_rider: [
    { key: "rider_cost_monthly", label: "Rider cost / month", type: "currency", min: 0, max: 1000, placeholder: "8" },
    { key: "payout_multiplier", label: "Payout multiplier", type: "number", min: 1, max: 10, placeholder: "2" },
  ],
  value_back: [
    { key: "reward_pct", label: "Reward", type: "percent", min: 0, max: 100, placeholder: "5" },
    { key: "evaluation_period_days", label: "Evaluation period", type: "number", min: 1, max: 365, placeholder: "30" },
  ],
  telematics: [
    { key: "discount_pct", label: "Discount", type: "percent", min: 0, max: 100, placeholder: "15" },
    { key: "minimum_period_days", label: "Minimum period", type: "number", min: 0, max: 365, placeholder: "90" },
  ],
  bundling: [
    { key: "combined_discount_pct", label: "Combined discount", type: "percent", min: 0, max: 100, placeholder: "10" },
  ],
  claims_ux: [
    { key: "estimated_completion_time_min", label: "Est. completion (min)", type: "number", min: 1, max: 120, placeholder: "8" },
    { key: "ai_triage", label: "AI triage", type: "boolean" },
  ],
  policy_renewal: [
    { key: "price_change_pct", label: "Premium change", type: "percent", min: -50, max: 100, placeholder: "0" },
    { key: "notice_days", label: "Renewal notice", type: "number", min: 0, max: 365, placeholder: "45" },
  ],
  discount_offer: [
    { key: "discount_pct", label: "Discount", type: "percent", min: 0, max: 100, placeholder: "10" },
  ],
  channel_change: [],
  custom: [],
};

export function scenarioConfigSchema(scenarioType: string): ConfigField[] {
  return SCENARIO_CONFIG_SCHEMA[scenarioType] ?? [];
}

// Every config key the form manages across all scenarios — so an edit can
// preserve unknown keys while replacing the ones it owns.
export function allManagedConfigKeys(): string[] {
  const keys = new Set<string>(["hypothesis", "target_segment"]);
  Object.values(SCENARIO_CONFIG_SCHEMA).forEach((fields) =>
    fields.forEach((f) => keys.add(f.key))
  );
  return [...keys];
}

// ---- config formatting --------------------------------------------------

export function humanizeKey(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\bpct\b/i, "%")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatConfigValue(key: string, value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (Array.isArray(value)) {
    return value.map((v) => humanizeKey(String(v))).join(", ");
  }
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") {
    const k = key.toLowerCase();
    if (k.includes("pct") || k.includes("percent")) return `${value}%`;
    if (k.includes("cost") || k.includes("monthly") || k.includes("base") || k.includes("price_") && !k.includes("change")) {
      return `$${value}`;
    }
    if (k.includes("multiplier")) return `${value}×`;
    return new Intl.NumberFormat("en-US").format(value);
  }
  return humanizeKey(String(value));
}

// A short chip label for the card, e.g. "+12% premium" or "$8/mo".
export function headlineChip(scenarioType: string, config: Record<string, unknown>): string | null {
  const meta = scenarioMeta(scenarioType);
  for (const key of meta.headlineKeys) {
    const v = config[key];
    if (v === undefined || v === null) continue;
    const k = key.toLowerCase();
    if (typeof v === "number") {
      if (k.includes("price_change")) return `${v > 0 ? "+" : ""}${v}% premium`;
      if (k.includes("discount")) return `${v}% off`;
      if (k.includes("reward")) return `${v}% back`;
      if (k.includes("monthly") || k.includes("base")) return `$${v}/mo`;
      if (k.includes("multiplier")) return `${v}× payout`;
      if (k.includes("days")) return `${v}-day window`;
      if (k.includes("min")) return `~${v} min`;
      return `${humanizeKey(key)}: ${v}`;
    }
    if (typeof v === "string") return humanizeKey(v);
    if (Array.isArray(v) && v.length) return v.map((x) => humanizeKey(String(x))).join(" + ");
    if (typeof v === "boolean" && v) return humanizeKey(key);
  }
  return null;
}
