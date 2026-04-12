"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type ImportSummary = {
  total_rows: number;
  imported: number;
  updated: number;
  skipped: number;
  errors: Array<{ row: number; reason: string; asin?: string }>;
};

export function AmazonImportClient() {
  const [file, setFile] = useState<File | null>(null);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit() {
    if (!file) return;
    setError(null);
    setMessage(null);
    setSummary(null);
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("file", file, file.name);
      const response = await fetch("/api/admin/amazon/import-csv", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!response.ok) {
        let message = "Import failed.";
        try {
          const data = (await response.json()) as { error?: string };
          if (data?.error) {
            message = data.error;
          }
        } catch {
          const text = await response.text();
          if (text) message = text;
        }
        throw new Error(message);
      }
      const data = (await response.json()) as ImportSummary;
      setSummary(data);
      setMessage(data.errors.length ? "Import completed with issues." : "Import completed successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to import CSV.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold">Import Amazon Products</h2>
        <p className="text-sm text-muted-foreground">
          Upload a CSV export from your scraper extension. We normalize and upsert products in bulk.
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          <div className="font-medium">Import failed</div>
          <p className="mt-1 break-words">{error}</p>
        </div>
      ) : null}

      {message ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </div>
      ) : null}

      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">CSV File</label>
          <input
            type="file"
            accept=".csv"
            onChange={(event) => {
              const selected = event.target.files?.[0] || null;
              setFile(selected);
            }}
          />
          {file ? (
            <p className="text-xs text-muted-foreground">
              {file.name} - {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
          ) : null}
        </div>
        <div className="flex gap-2">
          <Button onClick={submit} disabled={!file || isSubmitting}>
            {isSubmitting ? "Importing..." : "Import CSV"}
          </Button>
        </div>
      </div>

      {summary ? (
        <div className="rounded-lg border border-border bg-card p-4 space-y-4 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold">Import summary</h3>
              <p className="text-muted-foreground">
                Review how many rows were imported and which ones still need attention.
              </p>
            </div>
            <Badge className={summary.errors.length ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}>
              {summary.errors.length ? "Completed with issues" : "Completed"}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Total rows</div>
              <div className="mt-1 text-xl font-semibold">{summary.total_rows}</div>
            </div>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
              <div className="text-xs uppercase tracking-wide text-emerald-700">Imported</div>
              <div className="mt-1 text-xl font-semibold text-emerald-900">{summary.imported}</div>
            </div>
            <div className="rounded-lg border border-sky-200 bg-sky-50 p-3">
              <div className="text-xs uppercase tracking-wide text-sky-700">Updated</div>
              <div className="mt-1 text-xl font-semibold text-sky-900">{summary.updated}</div>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <div className="text-xs uppercase tracking-wide text-amber-700">Skipped</div>
              <div className="mt-1 text-xl font-semibold text-amber-900">{summary.skipped}</div>
            </div>
          </div>

          {summary.errors.length ? (
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-foreground">Rows that need attention</h4>
                <p className="text-muted-foreground">
                  These rows were skipped. Fix them in the source CSV and re-import.
                </p>
              </div>
              <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
                {summary.errors.map((err) => (
                  <div
                    key={`${err.row}-${err.asin ?? ""}-${err.reason}`}
                    className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3"
                  >
                    <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-rose-800">
                      <span>Row {err.row}</span>
                      {err.asin ? <span>ASIN: {err.asin}</span> : null}
                    </div>
                    <p className="mt-2 break-words text-sm text-rose-900">{err.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
