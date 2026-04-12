import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "../../../db/index.js";
import { merchants, productOffers } from "../../../db/schema.js";

type OfferWithMerchant = {
  id: string;
  productId: string;
  merchantId: string;
  affiliateProgramId: string | null;
  offerUrl: string;
  price: string | null;
  wasPrice: string | null;
  coupon: string | null;
  dealText: string | null;
  isPrimary: boolean;
  createdAt: Date;
  merchant: {
    id: string;
    name: string;
    slug: string;
    logoUrl?: string | null;
    websiteUrl?: string | null;
    affiliateIdentifier?: string | null;
  } | null;
};

export async function loadPrimaryOffers(productIds: string[]) {
  const map = new Map<string, OfferWithMerchant>();
  if (productIds.length === 0) return map;

  const offers = await db
    .select()
    .from(productOffers)
    .where(
      and(
        inArray(productOffers.productId, productIds),
        eq(productOffers.isPrimary, true),
        eq(productOffers.isActive, true),
      ),
    );

  if (offers.length === 0) {
    return map;
  }

  const merchantIds = Array.from(new Set(offers.map((offer) => offer.merchantId)));
  const merchantRows = await db.select().from(merchants).where(inArray(merchants.id, merchantIds));
  const merchantMap = new Map(merchantRows.map((row) => [row.id, row]));

  for (const offer of offers) {
    map.set(offer.productId, {
      ...offer,
      merchant: merchantMap.get(offer.merchantId) || null,
    });
  }

  return map;
}

export async function loadOffersWithMerchants(productId: string, includeInactive = false) {
  const offers = await db
    .select()
    .from(productOffers)
    .where(
      includeInactive
        ? eq(productOffers.productId, productId)
        : and(eq(productOffers.productId, productId), eq(productOffers.isActive, true)),
    )
    .orderBy(sql`${productOffers.isPrimary} desc`, sql`${productOffers.createdAt} desc`);

  if (offers.length === 0) return [];

  const merchantIds = Array.from(new Set(offers.map((offer) => offer.merchantId)));
  const merchantRows = await db.select().from(merchants).where(inArray(merchants.id, merchantIds));
  const merchantMap = new Map(merchantRows.map((row) => [row.id, row]));

  return offers.map((offer) => ({
    ...offer,
    merchant: merchantMap.get(offer.merchantId) || null,
  }));
}

