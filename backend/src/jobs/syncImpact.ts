import { db } from "../db/index.js";
import { conversions } from "../db/schema.js";

type ImpactConversion = {
  id: string;
  toolId: string;
  affiliateProgramId: string;
  revenue: number;
  commission: number;
  convertedAt: Date;
};

export async function syncImpact() {
  const apiKey = process.env.IMPACT_API_KEY;
  if (!apiKey) {
    console.log("IMPACT_API_KEY not set; skipping sync");
    return;
  }

  // TODO: replace with Impact API calls and cursor pagination.
  const impactResults: ImpactConversion[] = [];

  for (const row of impactResults) {
    await db
      .insert(conversions)
      .values({
        toolId: row.toolId,
        affiliateProgramId: row.affiliateProgramId,
        network: "impact",
        networkConversionId: row.id,
        revenue: row.revenue.toString(),
        commission: row.commission.toString(),
        convertedAt: row.convertedAt,
      })
      // Idempotent daily sync via unique (network, network_conversion_id)
      .onConflictDoNothing();
  }
}
