import type { FastifyInstance } from "fastify";
import { randomUUID } from "crypto";
import { db } from "../../../db/index.js";
import { productOffers, products } from "../../../db/schema.js";
import { requireAuth } from "../../../middleware/requireAuth.js";
import { requirePermission } from "../../../middleware/requirePermission.js";
import { normalizeAmazonItem, ensureUniqueSlug, ensureAmazonMerchant } from "../services/amazonHelpers.js";
import { errorResponseSchema } from "../schemas/jobSchemas.js";

export async function registerManualProductRoutes(app: FastifyInstance) {
  app.post("/api/jobs/manual-products", {
    preHandler: [requireAuth, requirePermission("manage_jobs")],
    schema: {
      description: "Manually import products (admin)",
      body: {
        type: "object",
        properties: {
          source: { type: "string" },
          items: { type: "array", items: { type: "object" } },
          url: { type: "string" },
          title: { type: "string" },
        },
      },
      response: {
        200: {
          type: "object",
          properties: {
            ok: { type: "boolean" },
            source: { type: "string" },
            received: { type: "number" },
            created: { type: "number" },
            products: {
              type: "array",
              items: {
                type: "object",
                properties: { id: { type: "string" }, slug: { type: "string" } },
                required: ["id", "slug"],
              },
            },
          },
          required: ["ok", "source", "received", "created"],
        },
        400: errorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const body = request.body as { source?: string; items?: Array<Record<string, unknown>> } & Record<string, unknown>;
      let source = typeof body?.source === "string" ? body.source.toLowerCase() : "";
      if (!source) {
        const url = typeof body?.url === "string" ? body.url.toLowerCase() : "";
        if (url.includes("amazon.")) source = "amazon";
        if (url.includes("awin")) source = "awin";
        if (url.includes("impact")) source = "impact";
      }
      if (!source) {
        const hasAmazonShape = typeof body?.title === "string" || typeof body?.url === "string";
        if (hasAmazonShape) source = "amazon";
      }
      const items = Array.isArray(body?.items) ? body.items : [];
      const fallbackItem = items.length === 0 && body && typeof body === "object" ? body : null;
      const normalizedItems = items.length ? items : fallbackItem ? [fallbackItem] : [];

      if (!source || !["amazon", "awin", "impact"].includes(source)) {
        return reply.code(400).send({ error: "source must be one of: amazon, awin, impact" });
      }

      if (!Array.isArray(normalizedItems) || normalizedItems.length === 0) {
        return reply.code(400).send({ error: "items array is required" });
      }

      if (source === "amazon") {
        const amazonMerchantId = await ensureAmazonMerchant();
        const created: Array<{ id: string; slug: string }> = [];
        for (const item of normalizedItems) {
          const normalized = normalizeAmazonItem(item);
          const slug = await ensureUniqueSlug(normalized.slugBase);
          const [row] = await db
            .insert(products)
            .values({
              name: normalized.name,
              slug,
              websiteUrl: normalized.websiteUrl,
              imageUrl: normalized.imageUrl,
              status: "draft",
              createdBy: request.authUser?.id,
            })
            .returning({ id: products.id, slug: products.slug });
          if (row) {
            created.push(row);
            if (amazonMerchantId && normalized.offerUrl) {
              await db.insert(productOffers).values({
                productId: row.id,
                merchantId: amazonMerchantId,
                externalId: `manual-${randomUUID()}`,
                offerUrl: normalized.offerUrl,
                price: normalized.price != null ? normalized.price.toString() : null,
                wasPrice: normalized.wasPrice != null ? normalized.wasPrice.toString() : null,
                isPrimary: true,
                isActive: true,
                source: "manual",
              });
            }
          }
        }
        return { ok: true, source, received: normalizedItems.length, created: created.length, products: created };
      }

      return { ok: true, source, received: normalizedItems.length, created: 0 };
    },
  });
}

