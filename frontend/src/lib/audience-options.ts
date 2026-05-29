// Pre-defined filter chip options. Could later be derived from /personas/facets
// once we have a faceting endpoint. For hackathon, these match the persona-gen
// rotation so the chips line up with what's actually in the DB.

export const GENDERS = ["male", "female", "non_binary", "other"] as const;

export const MARITAL_STATUSES = ["single", "married", "divorced", "widowed"] as const;

export const RISK_TOLERANCES = ["low", "medium", "high"] as const;

export const CLAIMS_HISTORIES = ["none", "few", "many"] as const;

export const REGIONS = [
  "California", "Texas", "Florida", "New York", "Illinois",
  "Washington", "Oregon", "Colorado", "Utah", "Georgia",
  "North Carolina", "Massachusetts", "Arizona", "Nevada", "New Jersey",
] as const;

export const OCCUPATIONS = [
  "Software Engineer", "Nurse", "Teacher", "Logistics", "Retail",
  "Construction", "Healthcare", "Finance", "Sales", "Manager",
  "Engineer", "Consultant", "Driver", "Trades", "Other",
] as const;

export type FilterState = {
  age: [number, number];
  income: [number, number];
  genders: string[];
  marital: string[];
  risk: string[];
  claims: string[];
  regions: string[];
  occupations: string[];
  dependentsMin: number;
};

export const DEFAULT_FILTER: FilterState = {
  age: [22, 75],
  income: [25000, 250000],
  genders: [],
  marital: [],
  risk: [],
  claims: [],
  regions: [],
  occupations: [],
  dependentsMin: 0,
};

export function toApiPayload(f: FilterState) {
  return {
    age_min: f.age[0],
    age_max: f.age[1],
    income_min: f.income[0],
    income_max: f.income[1],
    genders: f.genders.length ? f.genders : null,
    marital_statuses: f.marital.length ? f.marital : null,
    risk_tolerances: f.risk.length ? f.risk : null,
    claims_histories: f.claims.length ? f.claims : null,
    regions: f.regions.length ? f.regions : null,
    occupations: f.occupations.length ? f.occupations : null,
    dependents_min: f.dependentsMin > 0 ? f.dependentsMin : null,
  };
}
