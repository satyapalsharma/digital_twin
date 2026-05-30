// Helpers for the persona definition / import flows.
// Field option lists mirror the backend Pydantic Literals in
// backend/app/schemas/persona.py so manual entry can't produce invalid rows.

export const GENDER_OPTIONS = ["male", "female", "non_binary", "other"] as const;
export const MARITAL_OPTIONS = ["single", "married", "divorced", "widowed"] as const;
export const RISK_OPTIONS = ["low", "medium", "high"] as const;
export const CLAIMS_OPTIONS = ["none", "few", "many"] as const;

export interface DraftPersona {
  name: string;
  age: number;
  gender: string;
  income: number;
  occupation: string;
  region: string;
  marital_status: string;
  dependents: number;
  risk_tolerance: string;
  claims_history: string;
  bio: string;
  attributes: Record<string, unknown>;
  source: string;
}

export const EMPTY_DRAFT: DraftPersona = {
  name: "",
  age: 35,
  gender: "female",
  income: 65000,
  occupation: "",
  region: "",
  marital_status: "married",
  dependents: 0,
  risk_tolerance: "medium",
  claims_history: "none",
  bio: "",
  attributes: {},
  source: "user_created",
};

// The columns we expect in an uploaded/pasted CSV. Order matters for the
// sample template download and the mapping preview.
export const CSV_COLUMNS = [
  "name",
  "age",
  "gender",
  "income",
  "occupation",
  "region",
  "marital_status",
  "dependents",
  "risk_tolerance",
  "claims_history",
  "bio",
] as const;

export const SAMPLE_CSV = `name,age,gender,income,occupation,region,marital_status,dependents,risk_tolerance,claims_history,bio
Maria Delgado,41,female,82000,Pediatric Nurse,Texas,married,2,low,few,"Juggling two kids and night shifts — wants predictable premiums and easy mobile claims."
Darnell Brooks,29,male,57000,Logistics Dispatcher,Georgia,single,0,medium,none,"First real job with benefits. Price-sensitive but open to telematics if it saves money."
Priya Nair,36,female,148000,Software Engineer,Washington,married,1,high,none,"Tech-savvy, will switch carriers for a better app experience and bundling discounts."
Robert Feldman,67,male,46000,Retired Teacher,Florida,widowed,0,low,many,"On a fixed income, worried about hurricane coverage and rising rates after recent claims."
Aisha Mohammed,33,female,71000,Small Business Owner,Illinois,married,3,medium,few,"Runs a bakery, needs life cover for her family and values a human agent she can call."`;

// Bundled dummy dataset for the "Use sample dataset" path so the demo works
// with zero data entry. Rows are realistic but clearly synthetic.
export const SAMPLE_PERSONAS: DraftPersona[] = [
  {
    name: "Maria Delgado", age: 41, gender: "female", income: 82000,
    occupation: "Pediatric Nurse", region: "Texas", marital_status: "married",
    dependents: 2, risk_tolerance: "low", claims_history: "few",
    bio: "Juggling two kids and night shifts — wants predictable premiums and easy mobile claims.",
    attributes: { life_stage: "growing_family", tech_savviness: "medium" }, source: "imported",
  },
  {
    name: "Darnell Brooks", age: 29, gender: "male", income: 57000,
    occupation: "Logistics Dispatcher", region: "Georgia", marital_status: "single",
    dependents: 0, risk_tolerance: "medium", claims_history: "none",
    bio: "First real job with benefits. Price-sensitive but open to telematics if it saves money.",
    attributes: { life_stage: "renter_starter", tech_savviness: "high" }, source: "imported",
  },
  {
    name: "Priya Nair", age: 36, gender: "female", income: 148000,
    occupation: "Software Engineer", region: "Washington", marital_status: "married",
    dependents: 1, risk_tolerance: "high", claims_history: "none",
    bio: "Tech-savvy, will switch carriers for a better app experience and bundling discounts.",
    attributes: { life_stage: "first_home", tech_savviness: "high" }, source: "imported",
  },
  {
    name: "Robert Feldman", age: 67, gender: "male", income: 46000,
    occupation: "Retired Teacher", region: "Florida", marital_status: "widowed",
    dependents: 0, risk_tolerance: "low", claims_history: "many",
    bio: "On a fixed income, worried about hurricane coverage and rising rates after recent claims.",
    attributes: { life_stage: "retiree", tech_savviness: "low" }, source: "imported",
  },
  {
    name: "Aisha Mohammed", age: 33, gender: "female", income: 71000,
    occupation: "Small Business Owner", region: "Illinois", marital_status: "married",
    dependents: 3, risk_tolerance: "medium", claims_history: "few",
    bio: "Runs a bakery, needs life cover for her family and values a human agent she can call.",
    attributes: { life_stage: "growing_family", tech_savviness: "medium" }, source: "imported",
  },
  {
    name: "Kevin O'Brien", age: 52, gender: "male", income: 119000,
    occupation: "Sales Director", region: "Massachusetts", marital_status: "divorced",
    dependents: 2, risk_tolerance: "high", claims_history: "few",
    bio: "Empty-nester soon, focused on retirement and consolidating policies into one bundle.",
    attributes: { life_stage: "empty_nester", tech_savviness: "medium" }, source: "imported",
  },
];

const ALLOWED: Record<string, readonly string[]> = {
  gender: GENDER_OPTIONS,
  marital_status: MARITAL_OPTIONS,
  risk_tolerance: RISK_OPTIONS,
  claims_history: CLAIMS_OPTIONS,
};

export interface ParseResult {
  rows: DraftPersona[];
  errors: string[];
}

// Minimal CSV parser that tolerates quoted fields with commas. Good enough for
// the import demo; not a full RFC-4180 implementation.
function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      out.push(cur); cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

// ---- column mapping -----------------------------------------------------

export type PersonaField =
  | "name" | "age" | "gender" | "income" | "occupation" | "region"
  | "marital_status" | "dependents" | "risk_tolerance" | "claims_history" | "bio";

export const PERSONA_FIELDS: { key: PersonaField; label: string; required?: boolean }[] = [
  { key: "name", label: "Name", required: true },
  { key: "age", label: "Age" },
  { key: "gender", label: "Gender" },
  { key: "income", label: "Income" },
  { key: "occupation", label: "Occupation" },
  { key: "region", label: "Region" },
  { key: "marital_status", label: "Marital status" },
  { key: "dependents", label: "Dependents" },
  { key: "risk_tolerance", label: "Risk tolerance" },
  { key: "claims_history", label: "Claims history" },
  { key: "bio", label: "Bio" },
];

// Common header names other systems use, so a CRM/warehouse export maps without
// hand-editing. Matched against the normalized header (lowercased, alnum-only).
export const HEADER_ALIASES: Record<PersonaField, string[]> = {
  name: ["name", "full_name", "fullname", "customer_name", "persona_name", "contact_name"],
  age: ["age", "age_years", "years"],
  gender: ["gender", "sex"],
  income: ["income", "annual_income", "yearly_income", "salary", "income_usd", "earnings"],
  occupation: ["occupation", "job", "job_title", "profession", "role", "title"],
  region: ["region", "state", "location", "area", "city", "market", "geo"],
  marital_status: ["marital_status", "marital", "marriage", "marriage_status"],
  dependents: ["dependents", "kids", "children", "num_dependents", "no_of_dependents", "dependent_count"],
  risk_tolerance: ["risk_tolerance", "risk", "risk_profile", "risk_appetite"],
  claims_history: ["claims_history", "claims", "claim_history", "prior_claims", "claim_count"],
  bio: ["bio", "about", "description", "notes", "summary", "profile"],
};

export type ColumnMapping = Partial<Record<PersonaField, string | null>>;

export interface RawCsv {
  headers: string[];
  records: Record<string, string>[];
  error?: string;
}

function normHeader(h: string): string {
  return h.toLowerCase().trim().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

/** Parse raw CSV into headers + records keyed by the original header text. */
export function parseCsv(text: string): RawCsv {
  const lines = text.trim().split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) {
    return { headers: [], records: [], error: "Need a header row and at least one data row." };
  }
  const headers = splitCsvLine(lines[0]);
  const records: Record<string, string>[] = [];
  for (let r = 1; r < lines.length; r++) {
    const cells = splitCsvLine(lines[r]);
    const rec: Record<string, string> = {};
    headers.forEach((h, i) => { rec[h] = cells[i] ?? ""; });
    records.push(rec);
  }
  return { headers, records };
}

/** Best-effort header -> persona-field mapping using names + aliases. */
export function autoDetectMapping(headers: string[]): ColumnMapping {
  const normed = headers.map((h) => ({ raw: h, norm: normHeader(h) }));
  const mapping: ColumnMapping = {};
  for (const field of PERSONA_FIELDS) {
    const aliases = HEADER_ALIASES[field.key];
    const hit = normed.find((h) => aliases.includes(h.norm));
    mapping[field.key] = hit ? hit.raw : null;
  }
  return mapping;
}

/** Turn raw records into validated drafts using the (possibly edited) mapping. */
export function recordsToDrafts(
  records: Record<string, string>[],
  mapping: ColumnMapping,
): ParseResult {
  const errors: string[] = [];
  const rows: DraftPersona[] = [];
  const get = (rec: Record<string, string>, field: PersonaField): string => {
    const header = mapping[field];
    return header ? (rec[header] ?? "") : "";
  };

  records.forEach((rec, idx) => {
    const name = get(rec, "name").trim();
    if (!name) { errors.push(`Row ${idx + 1}: no value mapped to Name — skipped.`); return; }
    rows.push({
      ...EMPTY_DRAFT,
      name,
      age: clampInt(get(rec, "age"), 18, 100, 35),
      gender: pick(get(rec, "gender"), ALLOWED.gender, "other"),
      income: clampInt(get(rec, "income"), 0, 100_000_000, 50000),
      occupation: get(rec, "occupation") || "Unspecified",
      region: get(rec, "region") || "Unknown",
      marital_status: pick(get(rec, "marital_status"), ALLOWED.marital_status, "single"),
      dependents: clampInt(get(rec, "dependents"), 0, 12, 0),
      risk_tolerance: pick(get(rec, "risk_tolerance"), ALLOWED.risk_tolerance, "medium"),
      claims_history: pick(get(rec, "claims_history"), ALLOWED.claims_history, "none"),
      bio: get(rec, "bio") || "",
      attributes: {},
      source: "imported",
    });
  });
  return { rows, errors };
}

export function parsePersonaCsv(text: string): ParseResult {
  const { records, error } = parseCsv(text);
  if (error) return { rows: [], errors: [error] };
  return recordsToDrafts(records, autoDetectMapping(Object.keys(records[0] ?? {})));
}

function clampInt(v: string, min: number, max: number, fallback: number): number {
  const n = parseInt(String(v).replace(/[^0-9-]/g, ""), 10);
  if (Number.isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function pick(v: string, allowed: readonly string[], fallback: string): string {
  const norm = String(v).toLowerCase().trim().replace(/\s+/g, "_");
  return allowed.includes(norm) ? norm : fallback;
}
