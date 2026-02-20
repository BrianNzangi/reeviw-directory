import { db } from "../db/index.js";
import { conversions } from "../db/schema.js";

type PartnerstackConversion = {
  id: string;
  toolId: string;
  affiliateProgramId: string;
  revenue: number;
  commission: number;
  convertedAt: Date;
};

export async function syncPartnerstack() {
  const apiKey = process.env.PARTNERSTACK_API_KEY;
  if (!apiKey) {
    console.log("PARTNERSTACK_API_KEY not set; skipping sync");
    return;
  }

  // TODO: replace with PartnerStack API call and pagination.
  const partnerstackResults: PartnerstackConversion[] = [];

  for (const row of partnerstackResults) {
    await db
      .insert(conversions)
      .values({
        toolId: row.toolId,
        affiliateProgramId: row.affiliateProgramId,
        network: "partnerstack",
        networkConversionId: row.id,
        revenue: row.revenue.toString(),
        commission: row.commission.toString(),
        convertedAt: row.convertedAt,
      })
      // Idempotent daily sync via unique (network, network_conversion_id)
      .onConflictDoNothing();
  }
}
