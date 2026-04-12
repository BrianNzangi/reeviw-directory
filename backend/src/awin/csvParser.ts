import { parse } from "csv-parse";
import { Readable } from "stream";

function normalizeHeader(header: string) {
  return header
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export async function parseCsvStream(
  stream: Readable,
  onRow: (row: Record<string, string>) => Promise<void>,
) {
  const parser = stream.pipe(
    parse({
      columns: (headers: string[]) => headers.map((header: string) => normalizeHeader(String(header))),
      relax_quotes: true,
      relax_column_count: true,
      skip_empty_lines: true,
      trim: true,
      bom: true,
      delimiter: ["\t", ","],
    }),
  );

  for await (const record of parser) {
    const row: Record<string, string> = {};
    for (const [key, value] of Object.entries(record)) {
      row[key] = typeof value === "string" ? value : value != null ? String(value) : "";
    }
    await onRow(row);
  }
}
