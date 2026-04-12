import { inArray, eq } from "drizzle-orm";
import { db } from "../../../db/index.js";
import { productTags, tags } from "../../../db/schema.js";

export async function loadProductTags(productIds: string[]) {
  if (productIds.length === 0) return new Map<string, Array<{ id: string; name: string; slug: string }>>();

  const rows = await db
    .select({
      productId: productTags.productId,
      id: tags.id,
      name: tags.name,
      slug: tags.slug,
    })
    .from(productTags)
    .innerJoin(tags, eq(productTags.tagId, tags.id))
    .where(inArray(productTags.productId, productIds));

  const map = new Map<string, Array<{ id: string; name: string; slug: string }>>();
  for (const row of rows) {
    const current = map.get(row.productId) || [];
    current.push({ id: row.id, name: row.name, slug: row.slug });
    map.set(row.productId, current);
  }
  return map;
}

