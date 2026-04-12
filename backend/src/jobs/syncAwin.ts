import { and, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { affiliatePrograms } from "../db/schema.js";
import { importAwinProgram } from "../awin/importer.js";

export async function syncAwin() {
  const programs = await db
    .select()
    .from(affiliatePrograms)
    .where(and(eq(affiliatePrograms.network, "awin"), eq(affiliatePrograms.isActive, true)));

  const now = Date.now();
  const results: Array<{ id: string; status: string; message?: string }> = [];

  for (const program of programs) {
    if (program.lastSyncedAt && program.syncFrequencyHours) {
      const nextAt = program.lastSyncedAt.getTime() + program.syncFrequencyHours * 60 * 60 * 1000;
      if (nextAt > now) {
        results.push({ id: program.id, status: "skipped", message: "Recently synced" });
        continue;
      }
    }

    const result = await importAwinProgram(program);
    results.push({ id: program.id, status: result.status, message: result.error });
  }

  return {
    total: programs.length,
    successes: results.filter((row) => row.status === "success").length,
    failed: results.filter((row) => row.status === "failed").length,
    skipped: results.filter((row) => row.status === "skipped").length,
    results,
  };
}
