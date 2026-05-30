"use client";

import { useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Upload,
  FileSpreadsheet,
  Sparkles,
  ClipboardPaste,
  Check,
  Download,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import {
  ColumnMapping,
  DraftPersona,
  PERSONA_FIELDS,
  SAMPLE_CSV,
  SAMPLE_PERSONAS,
  autoDetectMapping,
  parseCsv,
  recordsToDrafts,
} from "@/lib/persona-import";

type Step = "source" | "preview" | "done";
type SourceKind = "sample" | "upload" | "paste";

export function PersonaImportDialog() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("source");
  const [source, setSource] = useState<SourceKind | null>(null);
  const [rows, setRows] = useState<DraftPersona[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [pasteText, setPasteText] = useState("");
  // Raw CSV state for the editable column-mapping (upload/paste only).
  const [headers, setHeaders] = useState<string[]>([]);
  const [records, setRecords] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [importing, setImporting] = useState(false);
  const [insertedCount, setInsertedCount] = useState(0);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [skipDupes, setSkipDupes] = useState(true);
  const fileInput = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();

  // De-dup against personas already in the pool (name + region, case-insensitive).
  const dupeKey = (name: string, region: string) =>
    `${name.trim().toLowerCase()}|${region.trim().toLowerCase()}`;
  const existingKeys = useMemo(() => {
    const existing =
      qc.getQueryData<{ name: string; region: string }[]>(["personas-all"]) ?? [];
    return new Set(existing.map((p) => dupeKey(p.name, p.region)));
    // Recompute when a new set of rows is loaded (re-reads the latest cache).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qc, rows.length]);
  const dupeCount = useMemo(
    () => rows.filter((r) => existingKeys.has(dupeKey(r.name, r.region))).length,
    [rows, existingKeys]
  );

  const reset = () => {
    setStep("source"); setSource(null); setRows([]); setErrors([]);
    setPasteText(""); setInsertedCount(0); setProgress(null);
    setHeaders([]); setRecords([]); setMapping({});
  };

  const close = (o: boolean) => {
    setOpen(o);
    if (!o) setTimeout(reset, 200);
  };

  const loadParsed = (kind: SourceKind, text?: string) => {
    setSource(kind);
    if (kind === "sample") {
      setHeaders([]); setRecords([]); setMapping({});
      setRows(SAMPLE_PERSONAS);
      setErrors([]);
      setStep("preview");
      return;
    }
    // CSV / paste — keep raw records so the user can re-map columns.
    const parsed = parseCsv(text ?? "");
    if (parsed.error || parsed.records.length === 0) {
      toast.error(parsed.error ?? "No data rows found in that file.");
      return;
    }
    const detected = autoDetectMapping(parsed.headers);
    const { rows: drafts, errors: errs } = recordsToDrafts(parsed.records, detected);
    setHeaders(parsed.headers);
    setRecords(parsed.records);
    setMapping(detected);
    setRows(drafts);
    setErrors(errs);
    setStep("preview");
  };

  // Re-map a single field to a different CSV column (or none) and re-derive rows.
  const remap = (field: string, header: string | null) => {
    const next = { ...mapping, [field]: header };
    setMapping(next);
    const { rows: drafts, errors: errs } = recordsToDrafts(records, next);
    setRows(drafts);
    setErrors(errs);
  };

  const onFile = async (file: File) => {
    const text = await file.text();
    loadParsed("upload", text);
  };

  // Insert in chunks so thousands of rows stay under the API's per-call limit
  // and the user sees real progress instead of a frozen spinner.
  const CHUNK = 250;

  const runImport = async () => {
    const toInsert = skipDupes
      ? rows.filter((r) => !existingKeys.has(dupeKey(r.name, r.region)))
      : rows;
    if (toInsert.length === 0) {
      toast.error("Every row already exists in the pool — nothing to import.");
      return;
    }
    const payload = toInsert.map((r) => ({ ...r, source: r.source || "imported" }));
    setImporting(true);
    setProgress({ done: 0, total: payload.length });
    let inserted = 0;
    try {
      for (let i = 0; i < payload.length; i += CHUNK) {
        const batch = payload.slice(i, i + CHUNK);
        const res = await api.post<{ inserted: number }>("/personas/bulk", {
          personas: batch,
        });
        inserted += res.inserted;
        setProgress({ done: Math.min(i + batch.length, payload.length), total: payload.length });
      }
      setInsertedCount(inserted);
      qc.invalidateQueries({ queryKey: ["personas-all"] });
      qc.invalidateQueries({ queryKey: ["personas-count"] });
      setStep("done");
    } catch (err) {
      toast.error(`Import failed after ${inserted} inserted: ${String(err).slice(0, 100)}`);
    } finally {
      setImporting(false);
      setProgress(null);
    }
  };

  const downloadTemplate = () => {
    const blob = new Blob([SAMPLE_CSV], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "persona-import-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Upload className="size-4" />
          Import personas
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import personas in bulk</DialogTitle>
          <DialogDescription>
            Bring your own customer data — upload a CSV, paste rows, or start from a
            sample set. Rows are validated before they join the pool.
          </DialogDescription>
        </DialogHeader>

        <Stepper step={step} />
        <Separator />

        {step === "source" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <SourceCard
                icon={Sparkles}
                title="Use sample dataset"
                desc="6 ready-made insurance personas. Zero setup — great for a demo."
                onClick={() => loadParsed("sample")}
              />
              <SourceCard
                icon={FileSpreadsheet}
                title="Upload CSV"
                desc="Import a .csv export from your CRM or data warehouse."
                onClick={() => fileInput.current?.click()}
              />
              <SourceCard
                icon={ClipboardPaste}
                title="Paste rows"
                desc="Paste comma-separated rows straight from a spreadsheet."
                onClick={() => { setSource("paste"); setStep("preview"); }}
              />
            </div>

            <input
              ref={fileInput}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onFile(f);
                e.target.value = "";
              }}
            />

            <div className="flex items-center justify-between rounded-md border border-dashed border-border bg-surface-elevated/40 px-3 py-2.5">
              <p className="text-xs text-muted-foreground">
                Need the format? Download a pre-filled CSV template with the expected columns.
              </p>
              <Button variant="ghost" size="sm" onClick={downloadTemplate} className="gap-1.5 shrink-0">
                <Download className="size-3.5" /> Template
              </Button>
            </div>
          </div>
        )}

        {step === "preview" && source === "paste" && rows.length === 0 && (
          <div className="space-y-3">
            <label className="text-sm font-medium">Paste CSV rows (include the header)</label>
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              rows={8}
              placeholder={SAMPLE_CSV.split("\n").slice(0, 2).join("\n") + "\n…"}
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-xs font-mono resize-none"
            />
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setStep("source")} className="gap-1.5">
                <ArrowLeft className="size-3.5" /> Back
              </Button>
              <Button size="sm" className="flex-1" onClick={() => loadParsed("paste", pasteText)}>
                Parse rows
              </Button>
            </div>
          </div>
        )}

        {step === "preview" && rows.length > 0 && (
          <PreviewTable
            rows={rows}
            errors={errors}
            importing={importing}
            progress={progress}
            dupeCount={dupeCount}
            skipDupes={skipDupes}
            onToggleSkipDupes={() => setSkipDupes((v) => !v)}
            isDupe={(r) => existingKeys.has(dupeKey(r.name, r.region))}
            headers={headers}
            mapping={mapping}
            onRemap={remap}
            onBack={() => { setStep("source"); setRows([]); setErrors([]); setHeaders([]); setRecords([]); setMapping({}); }}
            onConfirm={runImport}
          />
        )}

        {step === "done" && (
          <div className="py-8 text-center space-y-4">
            <div className="size-14 mx-auto rounded-full bg-success/15 text-success grid place-items-center">
              <Check className="size-7" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Import complete</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {insertedCount} persona{insertedCount === 1 ? "" : "s"} added to the pool and
                ready to use in audiences and simulations.
              </p>
            </div>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" size="sm" onClick={() => { reset(); }}>
                Import more
              </Button>
              <Button size="sm" onClick={() => close(false)}>Done</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Stepper({ step }: { step: Step }) {
  const steps: { key: Step; label: string }[] = [
    { key: "source", label: "Source" },
    { key: "preview", label: "Preview & map" },
    { key: "done", label: "Import" },
  ];
  const idx = steps.findIndex((s) => s.key === step);
  return (
    <div className="flex items-center gap-2 text-xs">
      {steps.map((s, i) => (
        <div key={s.key} className="flex items-center gap-2">
          <span
            className={
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium " +
              (i <= idx ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")
            }
          >
            <span className={"size-4 grid place-items-center rounded-full text-[10px] " + (i < idx ? "bg-primary text-primary-foreground" : i === idx ? "bg-primary/20" : "bg-muted-foreground/20")}>
              {i < idx ? <Check className="size-2.5" /> : i + 1}
            </span>
            {s.label}
          </span>
          {i < steps.length - 1 && <span className="text-muted-foreground/40">—</span>}
        </div>
      ))}
    </div>
  );
}

function SourceCard({
  icon: Icon, title, desc, onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left rounded-lg border border-border bg-surface p-4 hover:border-primary/40 hover:shadow-sm transition-all space-y-2 cursor-pointer"
    >
      <div className="size-9 rounded-lg bg-primary/10 text-primary grid place-items-center">
        <Icon className="size-5" />
      </div>
      <p className="font-medium text-sm">{title}</p>
      <p className="text-xs text-muted-foreground leading-snug">{desc}</p>
    </button>
  );
}

function PreviewTable({
  rows, errors, importing, progress, dupeCount, skipDupes, onToggleSkipDupes, isDupe,
  headers, mapping, onRemap, onBack, onConfirm,
}: {
  rows: DraftPersona[];
  errors: string[];
  importing: boolean;
  progress: { done: number; total: number } | null;
  dupeCount: number;
  skipDupes: boolean;
  onToggleSkipDupes: () => void;
  isDupe: (r: DraftPersona) => boolean;
  headers: string[];
  mapping: ColumnMapping;
  onRemap: (field: string, header: string | null) => void;
  onBack: () => void;
  onConfirm: () => void;
}) {
  const preview = useMemo(() => rows.slice(0, 8), [rows]);
  const willImport = skipDupes ? rows.length - dupeCount : rows.length;
  return (
    <div className="space-y-3">
      {/* Column mapping — auto-detected from headers, user-editable.
          Only shown for CSV/paste sources (the sample set has no headers). */}
      {headers.length > 0 && (
        <div className="rounded-md border border-border bg-surface-elevated/40 p-3">
          <p className="text-xs font-medium text-muted-foreground mb-2">
            Map your columns → persona fields{" "}
            <span className="font-normal">(auto-detected from headers — adjust if needed)</span>
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
            {PERSONA_FIELDS.map((f) => {
              const value = mapping[f.key] ?? "";
              const unmapped = !value;
              return (
                <label key={f.key} className="flex items-center justify-between gap-2 text-xs">
                  <span className={"shrink-0 " + (f.required && unmapped ? "text-destructive font-medium" : "text-muted-foreground")}>
                    {f.label}{f.required ? " *" : ""}
                  </span>
                  <select
                    value={value}
                    onChange={(e) => onRemap(f.key, e.target.value || null)}
                    className="h-7 max-w-[55%] flex-1 rounded border border-input bg-background px-2 text-xs truncate"
                  >
                    <option value="">— none —</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {errors.length > 0 && (
        <div className="rounded-md border border-warning/40 bg-warning/10 p-2.5 text-xs text-warning-foreground space-y-0.5">
          {errors.slice(0, 4).map((e, i) => <p key={i}>⚠ {e}</p>)}
          {errors.length > 4 && <p>…and {errors.length - 4} more.</p>}
        </div>
      )}

      <div className="rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto max-h-64">
          <table className="w-full text-xs">
            <thead className="bg-surface-elevated text-muted-foreground sticky top-0">
              <tr className="text-left">
                <th className="px-3 py-2 font-medium">Name</th>
                <th className="px-3 py-2 font-medium text-right">Age</th>
                <th className="px-3 py-2 font-medium">Occupation</th>
                <th className="px-3 py-2 font-medium text-right">Income</th>
                <th className="px-3 py-2 font-medium">Region</th>
                <th className="px-3 py-2 font-medium">Risk</th>
                <th className="px-3 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {preview.map((r, i) => {
                const dup = isDupe(r);
                return (
                  <tr key={i} className={"border-t border-border " + (dup && skipDupes ? "opacity-50" : "")}>
                    <td className="px-3 py-2 font-medium">{r.name}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{r.age}</td>
                    <td className="px-3 py-2 text-muted-foreground">{r.occupation}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(r.income)}</td>
                    <td className="px-3 py-2 text-muted-foreground">{r.region}</td>
                    <td className="px-3 py-2 capitalize">{r.risk_tolerance}</td>
                    <td className="px-3 py-2">
                      {dup && <Badge variant="warning" className="text-[10px]">dup</Badge>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {dupeCount > 0 && (
        <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
          <input
            type="checkbox"
            checked={skipDupes}
            onChange={onToggleSkipDupes}
            className="size-3.5 accent-[var(--color-primary,currentColor)]"
          />
          Skip {dupeCount} row{dupeCount === 1 ? "" : "s"} already in the pool (matched on name + region)
        </label>
      )}

      {progress && (
        <div className="space-y-1">
          <Progress value={(progress.done / progress.total) * 100} />
          <p className="text-[11px] text-muted-foreground text-right tabular-nums">
            Importing {progress.done} / {progress.total}…
          </p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {rows.length} valid row{rows.length === 1 ? "" : "s"} parsed
          {rows.length > preview.length && ` · showing first ${preview.length}`}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onBack} disabled={importing} className="gap-1.5">
            <ArrowLeft className="size-3.5" /> Back
          </Button>
          <Button size="sm" onClick={onConfirm} disabled={importing || willImport === 0} className="gap-1.5">
            {importing ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
            Import {willImport}
          </Button>
        </div>
      </div>
    </div>
  );
}
