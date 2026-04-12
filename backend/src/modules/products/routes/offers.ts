import type { FastifyInstance } from "fastify";
import { and, eq, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db } from "../../../db/index.js";
import { merchants, productOffers, products } from "../../../db/schema.js";
import { requireAuth } from "../../../middleware/requireAuth.js";
import { requirePermission } from "../../../middleware/requirePermission.js";
import { errorResponseSchema, offerSchema } from "../schemas/productSchemas.js";

export async function registerOfferRoutes(app: FastifyInstance) {
  app.post("/api/products/:id/offers", {
    preHandler: [requireAuth, requirePermission("manage_products")],
    schema: {
      description: "Create product offer (admin)",
      params: {
        type: "object",
        properties: { id: { type: "string" } },
        required: ["id"],
      },
      body: {
        type: "object",
        properties: {
          merchantId: { type: "string" },
          affiliateProgramId: { type: ["string", "null"] },
          offerUrl: { type: "string" },
          price: { type: "number" },
          wasPrice: { type: "number" },
          coupon: { type: "string" },
          dealText: { type: "string" },
          isPrimary: { type: "boolean" },
          isActive: { type: "boolean" },
        },
        required: ["merchantId", "offerUrl"],
      },
      response: {
        201: offerSchema,
        400: errorResponseSchema,
        404: errorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const params = request.params as { id: string };
      const body = request.body as {
        merchantId?: string;
        affiliateProgramId?: string | null;
        offerUrl?: string;
        price?: number;
        wasPrice?: number;
        coupon?: string;
        dealText?: string;
        isPrimary?: boolean;
        isActive?: boolean;
      };

      if (!body?.merchantId || !body.offerUrl) {
        return reply.code(400).send({ error: "merchantId and offerUrl are required" });
      }

      const [product] = await db.select().from(products).where(eq(products.id, params.id)).limit(1);
      if (!product) {
        return reply.code(404).send({ error: "Product not found" });
      }

      const [existingPrimary] = await db
        .select()
        .from(productOffers)
        .where(and(eq(productOffers.productId, params.id), eq(productOffers.isPrimary, true)))
        .limit(1);

      const shouldBePrimary = body.isPrimary ?? !existingPrimary;

      if (shouldBePrimary) {
        await db
          .update(productOffers)
          .set({ isPrimary: false })
          .where(eq(productOffers.productId, params.id));
      }

      const [created] = await db
        .insert(productOffers)
        .values({
          productId: params.id,
          merchantId: body.merchantId,
          affiliateProgramId: body.affiliateProgramId ?? null,
          externalId: `manual-${randomUUID()}`,
          offerUrl: body.offerUrl,
          price: body.price != null ? body.price.toString() : null,
          wasPrice: body.wasPrice != null ? body.wasPrice.toString() : null,
          coupon: body.coupon,
          dealText: body.dealText,
          isActive: body.isActive ?? true,
          source: "manual",
          isPrimary: shouldBePrimary,
        })
        .returning();

      await app.cache.bumpVersion("offers");
      return reply.code(201).send(created);
    },
  });

  app.patch("/api/offers/:id", {
    preHandler: [requireAuth, requirePermission("manage_products")],
    schema: {
      description: "Update product offer (admin)",
      params: {
        type: "object",
        properties: { id: { type: "string" } },
        required: ["id"],
      },
      body: {
        type: "object",
        properties: {
          merchantId: { type: "string" },
          affiliateProgramId: { type: ["string", "null"] },
          offerUrl: { type: "string" },
          price: { type: "number" },
          wasPrice: { type: "number" },
          coupon: { type: "string" },
          dealText: { type: "string" },
          isPrimary: { type: "boolean" },
          isActive: { type: "boolean" },
        },
      },
      response: {
        200: offerSchema,
        404: errorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const params = request.params as { id: string };
      const body = request.body as Partial<{
        merchantId: string;
        affiliateProgramId: string | null;
        offerUrl: string;
        price: number;
        wasPrice: number;
        coupon: string;
        dealText: string;
        isPrimary: boolean;
        isActive: boolean;
      }>;

      const [existing] = await db.select().from(productOffers).where(eq(productOffers.id, params.id)).limit(1);
      if (!existing) {
        return reply.code(404).send({ error: "Offer not found" });
      }

      if (body.merchantId) {
        const [merchant] = await db.select().from(merchants).where(eq(merchants.id, body.merchantId)).limit(1);
        if (!merchant) {
          return reply.code(404).send({ error: "Merchant not found" });
        }
      }

      if (body.isPrimary) {
        await db
          .update(productOffers)
          .set({ isPrimary: false })
          .where(eq(productOffers.productId, existing.productId));
      }

      const updatePayload: Record<string, unknown> = {};
      if (body.merchantId !== undefined) updatePayload.merchantId = body.merchantId;
      if ("affiliateProgramId" in body) updatePayload.affiliateProgramId = body.affiliateProgramId ?? null;
      if (body.offerUrl !== undefined) updatePayload.offerUrl = body.offerUrl;
      if ("price" in body) updatePayload.price = body.price != null ? body.price.toString() : null;
      if ("wasPrice" in body) updatePayload.wasPrice = body.wasPrice != null ? body.wasPrice.toString() : null;
      if ("coupon" in body) updatePayload.coupon = body.coupon ?? null;
      if ("dealText" in body) updatePayload.dealText = body.dealText ?? null;
      if (body.isPrimary !== undefined) updatePayload.isPrimary = body.isPrimary;
      if (body.isActive !== undefined) updatePayload.isActive = body.isActive;

      const [updated] = await db
        .update(productOffers)
        .set(updatePayload)
        .where(eq(productOffers.id, params.id))
        .returning();

      if (body.isPrimary === false) {
        const [primary] = await db
          .select()
          .from(productOffers)
          .where(and(eq(productOffers.productId, existing.productId), eq(productOffers.isPrimary, true)))
          .limit(1);
        if (!primary && updated) {
          await db
            .update(productOffers)
            .set({ isPrimary: true })
            .where(eq(productOffers.id, updated.id));
        }
      }

      await app.cache.bumpVersion("offers");
      return updated;
    },
  });

  app.delete("/api/offers/:id", {
    preHandler: [requireAuth, requirePermission("manage_products")],
    schema: {
      description: "Delete product offer (admin)",
      params: {
        type: "object",
        properties: { id: { type: "string" } },
        required: ["id"],
      },
      response: {
        200: {
          type: "object",
          properties: { ok: { type: "boolean" } },
          required: ["ok"],
        },
        404: errorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const params = request.params as { id: string };
      const [deleted] = await db.delete(productOffers).where(eq(productOffers.id, params.id)).returning();
      if (!deleted) {
        return reply.code(404).send({ error: "Offer not found" });
      }

      if (deleted.isPrimary) {
        const [fallback] = await db
          .select()
          .from(productOffers)
          .where(eq(productOffers.productId, deleted.productId))
          .orderBy(sql`${productOffers.createdAt} desc`)
          .limit(1);
        if (fallback) {
          await db
            .update(productOffers)
            .set({ isPrimary: true })
            .where(eq(productOffers.id, fallback.id));
        }
      }

      await app.cache.bumpVersion("offers");
      return { ok: true };
    },
  });
}

