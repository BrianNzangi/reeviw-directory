import { parse } from "csv-parse";
import { Readable } from "stream";
import { and, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { merchants, productOffers, products } from "../db/schema.js";
import { slugify } from "../awin/utils.js";

const AMAZON_HOST = "https://www.amazon.com/dp/";
const ASIN_REGEX = /^[A-Z0-9]{10}$/;
const PRODUCT_NAME_MAX_LENGTH = 180;
const PRODUCT_SLUG_MAX_LENGTH = 180;

type CsvImportSummary = {
  total_rows: number;
  imported: number;
  updated: number;
  skipped: number;
  errors: Array<{ row: number; reason: string; asin?: string }>;
};

type NormalizedCsvRow = {
  asin: string;
  title: string;
  price?: number;
  imageUrl: string;
  rating?: number;
  reviewCount?: number;
  extraImages: string[];
};

type NormalizedCsvRowResult =
  | { ok: true; data: NormalizedCsvRow }
  | { ok: false; reason: string; asin?: string };

function normalizeHeader(value: string) {
  return value.trim().toLowerCase();
}

function normalizeValue(value: unknown) {
  if (value == null) return "";
  return String(value).trim();
}

function parsePrice(raw?: string) {
  if (!raw) return undefined;
  const cleaned = raw.replace(/[^0-9.]/g, "");
  if (!cleaned) return undefined;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseRating(raw?: string) {
  if (!raw) return undefined;
  const cleaned = raw.replace(/[^0-9.]/g, "");
  if (!cleaned) return undefined;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseReviewCount(raw?: string) {
  if (!raw) return undefined;
  const cleaned = raw.replace(/[^0-9]/g, "");
  if (!cleaned) return undefined;
  const parsed = Number(cleaned);
  if (!Number.isFinite(parsed)) return undefined;
  return Math.max(0, Math.floor(parsed));
}

function extractImageUrls(row: Record<string, string>) {
  const images: string[] = [];
  const primary = row["image url"] || row["imageurl"] || row["image"];
  if (primary) images.push(primary);

  for (const [key, value] of Object.entries(row)) {
    const normalized = normalizeHeader(key);
    if (normalized === "image url") continue;
    if (normalized.startsWith("image url")) {
      const url = normalizeValue(value);
      if (url) images.push(url);
    }
  }

  const deduped: string[] = [];
  const seen = new Set<string>();
  for (const url of images) {
    if (!seen.has(url)) {
      seen.add(url);
      deduped.push(url);
    }
  }
  return deduped;
}

function normalizeCsvRow(raw: Record<string, unknown>): NormalizedCsvRowResult {
  const normalized: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    normalized[normalizeHeader(key)] = normalizeValue(value);
  }

  const asin = (normalized["asin"] || "").toUpperCase();
  if (!asin || !ASIN_REGEX.test(asin)) {
    return { ok: false, reason: "ASIN is missing or invalid." };
  }

  const title = normalized["title"] || "";
  const imageUrl = normalized["image url"] || normalized["imageurl"] || normalized["image"] || "";
  if (!title) {
    return { ok: false, reason: "Title is required.", asin };
  }
  if (title.length > PRODUCT_NAME_MAX_LENGTH) {
    return {
      ok: false,
      reason: `Title exceeds ${PRODUCT_NAME_MAX_LENGTH} characters. Shorten it before importing.`,
      asin,
    };
  }
  if (!imageUrl) {
    return { ok: false, reason: "Primary image URL is required.", asin };
  }

  const price = parsePrice(normalized["price"]);
  const rating = parseRating(normalized["rating"]);
  const reviewCount = parseReviewCount(normalized["number of reviews"] || normalized["reviews"]);
  const extraImages = extractImageUrls(normalized);

  return {
    ok: true,
    data: {
      asin,
      title,
      price,
      imageUrl,
      rating,
      reviewCount,
      extraImages: extraImages.filter((url) => url !== imageUrl),
    },
  };
}

function buildProductSlug(base: string, suffix?: number) {
  const baseValue = (base || "amazon-product").slice(0, PRODUCT_SLUG_MAX_LENGTH).replace(/^-+|-+$/g, "") || "amazon-product";
  if (!suffix) return baseValue;

  const suffixValue = `-${suffix}`;
  const maxBaseLength = Math.max(1, PRODUCT_SLUG_MAX_LENGTH - suffixValue.length);
  const trimmedBase = baseValue.slice(0, maxBaseLength).replace(/-+$/g, "") || "amazon-product";
  return `${trimmedBase}${suffixValue}`;
}

function formatRowImportError(error: unknown) {
  const code =
    (error as { cause?: { code?: string }; code?: string })?.cause?.code
    || (error as { code?: string })?.code;
  const message = error instanceof Error ? error.message : "";

  if (code === "22001" || message.toLowerCase().includes("value too long")) {
    return `A product field exceeds the allowed length (${PRODUCT_NAME_MAX_LENGTH} characters for the title).`;
  }

  if (code === "23505") {
    return "A duplicate product or offer prevented this row from importing.";
  }

  if (code === "23503") {
    return "A required related record was missing while importing this row.";
  }

  return "This row could not be imported due to a database error.";
}

async function ensureAmazonMerchant() {
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
      source: "amazon",
      status: "active",
    })
    .returning({ id: merchants.id });

  return created?.id;
}

async function ensureUniqueProductSlug(base: string) {
  const normalized = buildProductSlug(base);
  let candidate = normalized;
  let suffix = 1;
  while (true) {
    const [existing] = await db.select({ id: products.id }).from(products).where(eq(products.slug, candidate)).limit(1);
    if (!existing) return candidate;
    suffix += 1;
    candidate = buildProductSlug(normalized, suffix);
  }
}

async function upsertAmazonOffer(merchantId: string, row: NormalizedCsvRow, tag: string) {
  const now = new Date();
  const affiliateUrl = `${AMAZON_HOST}${row.asin}?tag=${encodeURIComponent(tag)}`;

  const [existingOffer] = await db
    .select()
    .from(productOffers)
    .where(and(eq(productOffers.merchantId, merchantId), eq(productOffers.externalId, row.asin)))
    .limit(1);

  if (!existingOffer) {
    const slug = await ensureUniqueProductSlug(slugify(row.title) || row.asin);
    const [createdProduct] = await db
      .insert(products)
      .values({
        name: row.title,
        slug,
        websiteUrl: `${AMAZON_HOST}${row.asin}`,
        imageUrl: row.imageUrl,
        status: "draft",
      })
      .returning({ id: products.id });

    if (!createdProduct) {
      throw new Error("Unable to create product");
    }

    await db.insert(productOffers).values({
      productId: createdProduct.id,
      merchantId,
      externalId: row.asin,
      offerUrl: affiliateUrl,
      price: row.price != null ? row.price.toString() : null,
      rating: row.rating != null ? row.rating.toString() : null,
      reviewCount: row.reviewCount ?? null,
      extraImages: row.extraImages.length ? row.extraImages : null,
      lastSeenAt: now,
      isActive: true,
      source: "amazon_csv",
      isPrimary: true,
    });

    return { created: true, updated: false };
  }

  const updates: Record<string, unknown> = { lastSeenAt: now };
  let changed = false;

  if (row.price != null) {
    const nextPrice = row.price.toString();
    if (nextPrice !== existingOffer.price) {
      updates.price = nextPrice;
      changed = true;
    }
  }

  if (affiliateUrl !== existingOffer.offerUrl) {
    updates.offerUrl = affiliateUrl;
    changed = true;
  }

  if (row.rating != null) {
    const nextRating = row.rating.toString();
    if (nextRating !== existingOffer.rating) {
      updates.rating = nextRating;
      changed = true;
    }
  }

  if (row.reviewCount != null && row.reviewCount !== existingOffer.reviewCount) {
    updates.reviewCount = row.reviewCount;
    changed = true;
  }

  if (row.extraImages.length) {
    const nextImages = row.extraImages;
    const current = Array.isArray(existingOffer.extraImages) ? existingOffer.extraImages : [];
    if (JSON.stringify(nextImages) !== JSON.stringify(current)) {
      updates.extraImages = nextImages;
      changed = true;
    }
  }

  if (changed) {
    await db.update(productOffers).set(updates).where(eq(productOffers.id, existingOffer.id));
  } else {
    await db.update(productOffers).set({ lastSeenAt: now }).where(eq(productOffers.id, existingOffer.id));
  }

  // Only fill missing product fields to avoid overwriting admin edits.
  if (row.imageUrl) {
    const [product] = await db
      .select({ id: products.id, imageUrl: products.imageUrl, websiteUrl: products.websiteUrl })
      .from(products)
      .where(eq(products.id, existingOffer.productId))
      .limit(1);
    if (product) {
      const productUpdates: Record<string, unknown> = {};
      if (!product.imageUrl && row.imageUrl) productUpdates.imageUrl = row.imageUrl;
      if (!product.websiteUrl) productUpdates.websiteUrl = `${AMAZON_HOST}${row.asin}`;
      if (Object.keys(productUpdates).length) {
        await db.update(products).set(productUpdates).where(eq(products.id, product.id));
      }
    }
  }

  return { created: false, updated: changed };
}

export async function importAmazonCsv(options: {
  stream: Readable;
  maxRows?: number;
  batchSize?: number;
}) {
  const tag = process.env.AMAZON_ASSOCIATE_TAG;
  if (!tag) {
    throw new Error("AMAZON_ASSOCIATE_TAG is required");
  }
  const associateTag: string = tag;

  const merchantId = await ensureAmazonMerchant();
  if (!merchantId) throw new Error("Unable to resolve Amazon merchant");

  const maxRows = options.maxRows ?? 10000;
  const batchSize = options.batchSize ?? 100;

  const summary: CsvImportSummary = {
    total_rows: 0,
    imported: 0,
    updated: 0,
    skipped: 0,
    errors: [],
  };

  const parser = options.stream.pipe(
    parse({
      columns: true,
      relax_column_count: true,
      skip_empty_lines: true,
      trim: true,
    }),
  );

  const batch: Array<{ rowIndex: number; raw: Record<string, unknown> }> = [];

  async function processBatch(items: Array<{ rowIndex: number; raw: Record<string, unknown> }>) {
    for (const item of items) {
      const normalizedResult = normalizeCsvRow(item.raw);
      if (!normalizedResult.ok) {
        summary.skipped += 1;
        if (summary.errors.length < 50) {
          summary.errors.push({
            row: item.rowIndex,
            asin: normalizedResult.asin,
            reason: normalizedResult.reason,
          });
        }
        continue;
      }

      const normalized = normalizedResult.data;

      try {
        const result = await upsertAmazonOffer(merchantId, normalized, associateTag);
        if (result.created) summary.imported += 1;
        else if (result.updated) summary.updated += 1;
        else summary.skipped += 1;
      } catch (error) {
        summary.skipped += 1;
        if (summary.errors.length < 50) {
          summary.errors.push({
            row: item.rowIndex,
            asin: normalized.asin,
            reason: formatRowImportError(error),
          });
        }
      }
    }
  }

  for await (const record of parser) {
    summary.total_rows += 1;
    if (summary.total_rows > maxRows) {
      throw new Error(`CSV exceeds maximum rows (${maxRows}).`);
    }
    batch.push({ rowIndex: summary.total_rows, raw: record as Record<string, unknown> });
    if (batch.length >= batchSize) {
      await processBatch(batch.splice(0, batch.length));
    }
  }

  if (batch.length) {
    await processBatch(batch.splice(0, batch.length));
  }

  return summary;
}
