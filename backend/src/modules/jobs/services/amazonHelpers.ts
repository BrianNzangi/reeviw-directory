import { eq } from "drizzle-orm";
import { db } from "../../../db/index.js";
import { merchants, products } from "../../../db/schema.js";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function ensureUniqueSlug(base: string) {
  const normalized = base || "amazon-product";
  let candidate = normalized;
  let suffix = 1;
  while (true) {
    const [existing] = await db.select({ id: products.id }).from(products).where(eq(products.slug, candidate)).limit(1);
    if (!existing) return candidate;
    suffix += 1;
    candidate = `${normalized}-${suffix}`;
  }
}

export function parsePrice(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return undefined;
  const normalized = value.replace(/[^0-9.]/g, "");
  if (!normalized) return undefined;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function normalizeAmazonItem(item: Record<string, unknown>) {
  const title = typeof item.title === "string" ? item.title.trim() : "";
  const url = typeof item.url === "string" ? item.url.trim() : "";
  const images = Array.isArray(item.images) ? item.images.filter((image) => typeof image === "string") : [];
  const imageUrl = images.length ? String(images[0]) : undefined;
  const price = parsePrice(item.price);
  const wasPrice = parsePrice(item.originalPrice);

  return {
    name: title || "Amazon product",
    slugBase: slugify(title || url || "amazon-product"),
    websiteUrl: url || undefined,
    imageUrl,
    price,
    wasPrice,
    offerUrl: url || undefined,
  };
}

export async function ensureAmazonMerchant() {
  const [existing] = await db
    .select({ id: merchants.id })
    .from(merchants)
    .where(eq(merchants.slug, "amazon"))
    .limit(1);
  if (existing) return existing.id;

  const [created] = await db
    .insert(merchants)
    .values({
      name: "Amazon",
      slug: "amazon",
      websiteUrl: "https://www.amazon.com",
    })
    .returning({ id: merchants.id });

  return created?.id;
}

