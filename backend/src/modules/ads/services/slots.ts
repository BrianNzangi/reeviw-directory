import { db } from "../../../db/index.js";
import { adSlots } from "../../../db/schema.js";
import { eq } from "drizzle-orm";
import { AD_SLOT_DEFINITIONS } from "../constants/slots.js";

export async function ensureAdSlots() {
  const rows = await db.select().from(adSlots);
  const existing = new Map(rows.map((row) => [row.slug, row] as const));
  const missing = AD_SLOT_DEFINITIONS.filter((slot) => !existing.has(slot.slug));
  if (missing.length) {
    await db
      .insert(adSlots)
      .values(missing.map((slot) => ({ slug: slot.slug, device: "all", description: slot.description })))
      .onConflictDoNothing();
  }

  for (const definition of AD_SLOT_DEFINITIONS) {
    const existingRow = existing.get(definition.slug);
    if (existingRow && existingRow.description !== definition.description) {
      await db
        .update(adSlots)
        .set({ description: definition.description })
        .where(eq(adSlots.id, existingRow.id));
    }
  }
}

