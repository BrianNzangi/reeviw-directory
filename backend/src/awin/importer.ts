import { and, desc, eq, lt } from "drizzle-orm";
import { createReadStream, promises as fs } from "fs";
import { db } from "../db/index.js";
import {
  affiliatePrograms,
  feedSyncLogs,
  merchants,
  productOffers,
  products,
} from "../db/schema.js";
import { downloadFeed } from "./feedDownloader.js";
import { parseCsvStream } from "./csvParser.js";
import { openZipCsvStream } from "./zipExtractor.js";
import { hashSecret, normalizeExternalId, slugify } from "./utils.js";

type ImportResult = {
  status: "success" | "failed" | "skipped";
  logId?: string;
  productsSeen: number;
  productsCreated: number;
  productsUpdated: number;
  productsDisabled: number;
  error?: string;
};

type NormalizedRow = {
  externalId: string;
  title: string;
  description?: string;
  productUrl?: string;
  imageUrl?: string;
  affiliateUrl?: string;
  category?: string;
  availability?: string;
  priceAmount?: number;
  priceCurrency?: string;
  brand?: string;
  advertiserName?: string;
};

const ERROR_RATE_THRESHOLD = 0.02;
const MAX_ROW_ERRORS = 200;

function getField(row: Record<string, string>, keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (value != null && String(value).trim() !== "") {
      return String(value).trim();
    }
  }
  return "";
}

function parsePrice(value?: string) {
  if (!value) return {};
  const currencyMatch = value.match(/[A-Z]{3}/);
  const amountMatch = value.match(/-?\d+(?:[.,]\d+)?/);
  if (!amountMatch) return {};
  const normalizedAmount = amountMatch[0].replace(/,/g, "");
  const amount = Number(normalizedAmount);
  if (!Number.isFinite(amount)) return {};
  return { amount, currency: currencyMatch?.[0] };
}

function normalizeRow(row: Record<string, string>): NormalizedRow | null {
  const externalIdRaw = getField(row, ["id", "product_id", "aw_product_id"]);
  const externalId = normalizeExternalId(externalIdRaw);
  const title = getField(row, ["title", "product_name", "name"]);
  const affiliateUrl = getField(row, ["aw_deep_link", "aw_deeplink", "deeplink", "affiliate_link"]);
  const productUrl = getField(row, ["link", "product_url", "merchant_deep_link"]);
  const imageUrl = getField(row, ["image_link", "image_url", "image"]);
  const description = getField(row, ["description", "product_description"]);
  const category = getField(row, ["google_product_category", "product_type", "category"]);
  const availability = getField(row, ["availability", "stock_status", "stock"]);
  const priceRaw = getField(row, ["price", "search_price", "sale_price"]);
  const brand = getField(row, ["brand", "advertiser_name"]);
  const advertiserName = getField(row, ["advertiser_name", "merchant", "store_name", "program_name"]);

  if (!externalId || !affiliateUrl || !title) return null;
  const price = parsePrice(priceRaw);

  return {
    externalId,
    title,
    description: description || undefined,
    productUrl: productUrl || undefined,
    imageUrl: imageUrl || undefined,
    affiliateUrl: affiliateUrl || productUrl || undefined,
    category: category || undefined,
    availability: availability || undefined,
    priceAmount: price.amount,
    priceCurrency: price.currency,
    brand: brand || undefined,
    advertiserName: advertiserName || undefined,
  };
}

async function ensureUniqueProductSlug(base: string) {
  const normalized = base || "awin-product";
  let candidate = normalized;
  let suffix = 1;
  while (true) {
    const [existing] = await db.select({ id: products.id }).from(products).where(eq(products.slug, candidate)).limit(1);
    if (!existing) return candidate;
    suffix += 1;
    candidate = `${normalized}-${suffix}`;
  }
}

async function resolveMerchantId(
  programId: string,
  programName: string,
  merchantState: { id: string | null | undefined },
  row: NormalizedRow,
) {
  if (merchantState.id) return merchantState.id;
  const name = row.advertiserName || programName;
  if (!name) return null;
  const baseSlug = slugify(name);

  const [existingByName] = await db.select({ id: merchants.id }).from(merchants).where(eq(merchants.name, name)).limit(1);
  if (existingByName) {
    await db.update(affiliatePrograms).set({ merchantId: existingByName.id }).where(eq(affiliatePrograms.id, programId));
    merchantState.id = existingByName.id;
    return existingByName.id;
  }

  const [existingBySlug] = await db.select({ id: merchants.id }).from(merchants).where(eq(merchants.slug, baseSlug)).limit(1);
  if (existingBySlug) {
    await db.update(affiliatePrograms).set({ merchantId: existingBySlug.id }).where(eq(affiliatePrograms.id, programId));
    merchantState.id = existingBySlug.id;
    return existingBySlug.id;
  }

  const slug = await ensureUniqueMerchantSlug(baseSlug || "awin-merchant");
  const [created] = await db
    .insert(merchants)
    .values({ name, slug, status: "active", source: "awin" })
    .returning({ id: merchants.id });

  if (created?.id) {
    await db.update(affiliatePrograms).set({ merchantId: created.id }).where(eq(affiliatePrograms.id, programId));
    merchantState.id = created.id;
  }
  return created?.id ?? null;
}

async function ensureUniqueMerchantSlug(base: string) {
  const normalized = base || "merchant";
  let candidate = normalized;
  let suffix = 1;
  while (true) {
    const [existing] = await db.select({ id: merchants.id }).from(merchants).where(eq(merchants.slug, candidate)).limit(1);
    if (!existing) return candidate;
    suffix += 1;
    candidate = `${normalized}-${suffix}`;
  }
}

export async function importAwinProgram(program: typeof affiliatePrograms.$inferSelect): Promise<ImportResult> {
  const startedAt = new Date();
  const [log] = await db
    .insert(feedSyncLogs)
    .values({
      network: "awin",
      affiliateProgramId: program.id,
      status: "running",
      startedAt,
      metaJson: program.feedUrl ? { feedHash: hashSecret(program.feedUrl) } : null,
    })
    .returning({ id: feedSyncLogs.id });

  if (!program.feedUrl) {
    await db
      .update(feedSyncLogs)
      .set({
        status: "failed",
        finishedAt: new Date(),
        errorMessage: "Missing feed URL",
      })
      .where(eq(feedSyncLogs.id, log.id));
    return {
      status: "failed",
      logId: log.id,
      productsSeen: 0,
      productsCreated: 0,
      productsUpdated: 0,
      productsDisabled: 0,
      error: "Missing feed URL",
    };
  }

  let downloadPath: string | null = null;
  try {
    const [lastSuccess] = await db
      .select({ meta: feedSyncLogs.metaJson })
      .from(feedSyncLogs)
      .where(and(eq(feedSyncLogs.affiliateProgramId, program.id), eq(feedSyncLogs.status, "success")))
      .orderBy(desc(feedSyncLogs.startedAt))
      .limit(1);

    const meta = (lastSuccess?.meta as Record<string, string> | null) ?? null;
    const download = await downloadFeed(program.feedUrl, {
      timeoutMs: 120_000,
      maxAttempts429: 5,
      maxAttempts5xx: 3,
      ifNoneMatch: meta?.etag ?? null,
      ifModifiedSince: meta?.lastModified ?? null,
    });

    const nextMeta = {
      feedHash: hashSecret(program.feedUrl),
      etag: download.etag ?? null,
      lastModified: download.lastModified ?? null,
      status: download.status,
      bytes: download.bytes,
      contentType: download.contentType ?? null,
      notModified: download.notModified,
    };

    if (download.notModified) {
      await db
        .update(feedSyncLogs)
        .set({
          status: "success",
          finishedAt: new Date(),
          metaJson: nextMeta,
        })
        .where(eq(feedSyncLogs.id, log.id));
      await db
        .update(affiliatePrograms)
        .set({ lastSyncedAt: new Date() })
        .where(eq(affiliatePrograms.id, program.id));
      return {
        status: "success",
        logId: log.id,
        productsSeen: 0,
        productsCreated: 0,
        productsUpdated: 0,
        productsDisabled: 0,
      };
    }

    if (!download.filePath) {
      throw new Error("Feed download failed.");
    }

    downloadPath = download.filePath;

    let stream: NodeJS.ReadableStream;
    if (program.feedFormat === "zip_csv") {
      const zip = await openZipCsvStream(downloadPath);
      stream = zip.stream;
    } else if (program.feedFormat === "csv") {
      stream = createReadStream(downloadPath);
    } else {
      throw new Error(`Unsupported feed format: ${program.feedFormat}`);
    }

    let productsSeen = 0;
    let productsCreated = 0;
    let productsUpdated = 0;
    let productsDisabled = 0;
    let rowErrors = 0;
    let lastRowError: string | undefined;

    const merchantState = { id: program.merchantId };

    await parseCsvStream(stream as any, async (record) => {
      productsSeen += 1;
      const normalized = normalizeRow(record);
      if (!normalized) {
        rowErrors += 1;
        lastRowError = "Missing required fields";
      } else {
        try {
          const merchantId = await resolveMerchantId(program.id, program.programName, merchantState, normalized);
          if (!merchantId) {
            rowErrors += 1;
            lastRowError = "Missing merchant";
          } else {
            const [existingOffer] = await db
              .select()
              .from(productOffers)
              .where(
                and(
                  eq(productOffers.affiliateProgramId, program.id),
                  eq(productOffers.externalId, normalized.externalId),
                ),
              )
              .limit(1);

            const availabilityValue = normalized.availability?.toLowerCase().replace(/\s+/g, "_");
            const hasAvailability = Boolean(availabilityValue);
            const isAvailable = hasAvailability ? availabilityValue === "in_stock" : true;

            if (!existingOffer) {
              const slug = await ensureUniqueProductSlug(slugify(normalized.title) || normalized.externalId);
              const [createdProduct] = await db
                .insert(products)
                .values({
                  name: normalized.title,
                  slug,
                  websiteUrl: normalized.productUrl,
                  imageUrl: normalized.imageUrl,
                  status: "draft",
                })
                .returning({ id: products.id });

              if (!createdProduct) {
                throw new Error("Unable to create product.");
              }

              await db.insert(productOffers).values({
                productId: createdProduct.id,
                merchantId,
                affiliateProgramId: program.id,
                externalId: normalized.externalId,
                feedCategory: normalized.category ?? null,
                offerUrl: normalized.affiliateUrl ?? normalized.productUrl ?? "",
                price: normalized.priceAmount != null ? normalized.priceAmount.toString() : null,
                availability: normalized.availability ?? null,
                lastSeenAt: startedAt,
                isActive: isAvailable,
                source: "awin_feed",
                isPrimary: true,
              });

              productsCreated += 1;
            } else {
              const updates: Record<string, unknown> = {
                lastSeenAt: startedAt,
              };
              let changed = false;

              if (normalized.priceAmount != null) {
                const nextPrice = normalized.priceAmount.toString();
                if (nextPrice !== existingOffer.price) {
                  updates.price = nextPrice;
                  changed = true;
                }
              }
              if (hasAvailability && normalized.availability !== existingOffer.availability) {
                updates.availability = normalized.availability ?? null;
                changed = true;
              }
              if (hasAvailability && existingOffer.isActive !== isAvailable) {
                updates.isActive = isAvailable;
                changed = true;
              }

              await db.update(productOffers).set(updates).where(eq(productOffers.id, existingOffer.id));

              if (changed) {
                productsUpdated += 1;
              }

            }
          }
        } catch (error) {
          rowErrors += 1;
          lastRowError = (error as Error).message;
        }
      }

      const errorRate = rowErrors / Math.max(1, productsSeen);
      if (rowErrors > MAX_ROW_ERRORS || errorRate > ERROR_RATE_THRESHOLD) {
        throw new Error(`Row error threshold exceeded (${rowErrors}/${productsSeen}).`);
      }
    });

    const disabled = await db
      .update(productOffers)
      .set({ isActive: false })
      .where(
        and(
          eq(productOffers.affiliateProgramId, program.id),
          lt(productOffers.lastSeenAt, startedAt),
        ),
      )
      .returning({ id: productOffers.id });
    productsDisabled = disabled.length;

    await db
      .update(feedSyncLogs)
      .set({
        status: "success",
        finishedAt: new Date(),
        productsSeen,
        productsCreated,
        productsUpdated,
        productsDisabled,
        errorMessage: rowErrors ? `Row errors: ${rowErrors}` : null,
        metaJson: {
          feedHash: hashSecret(program.feedUrl),
          etag: download.etag ?? null,
          lastModified: download.lastModified ?? null,
          status: download.status,
          bytes: download.bytes,
          contentType: download.contentType ?? null,
          lastRowError: lastRowError ?? null,
          rowErrors,
        },
      })
      .where(eq(feedSyncLogs.id, log.id));

    await db
      .update(affiliatePrograms)
      .set({ lastSyncedAt: new Date() })
      .where(eq(affiliatePrograms.id, program.id));

    return {
      status: "success",
      logId: log.id,
      productsSeen,
      productsCreated,
      productsUpdated,
      productsDisabled,
    };
  } catch (error) {
    const message = (error as Error).message || "AWIN import failed";
    await db
      .update(feedSyncLogs)
      .set({
        status: "failed",
        finishedAt: new Date(),
        errorMessage: message,
        errorStack: (error as Error).stack,
      })
      .where(eq(feedSyncLogs.id, log.id));

    return {
      status: "failed",
      logId: log.id,
      productsSeen: 0,
      productsCreated: 0,
      productsUpdated: 0,
      productsDisabled: 0,
      error: message,
    };
  } finally {
    if (downloadPath) {
      await fs.unlink(downloadPath).catch(() => null);
    }
  }
}
