import type { FastifyInstance } from "fastify";
import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "../../../db/index.js";
import { merchantClicks, merchants } from "../../../db/schema.js";
import { requireAuth } from "../../../middleware/requireAuth.js";
import { requirePermission } from "../../../middleware/requirePermission.js";
import { errorResponseSchema, merchantSchema } from "../schemas/productSchemas.js";

export async function registerMerchantRoutes(app: FastifyInstance) {
  app.post("/api/merchants", {
    preHandler: [requireAuth, requirePermission("manage_products")],
    schema: {
      description: "Create merchant (admin)",
      body: {
        type: "object",
        properties: {
          name: { type: "string" },
          slug: { type: "string" },
          websiteUrl: { type: "string" },
          affiliateIdentifier: { type: "string" },
          logoUrl: { type: "string" },
        },
        required: ["name", "slug"],
      },
      response: {
        201: merchantSchema,
        400: errorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const body = request.body as {
        name?: string;
        slug?: string;
        websiteUrl?: string;
        affiliateIdentifier?: string;
        logoUrl?: string;
      };

      if (!body?.name || !body?.slug) {
        return reply.code(400).send({ error: "name and slug are required" });
      }

      const [created] = await db
        .insert(merchants)
        .values({
          name: body.name,
          slug: body.slug,
          websiteUrl: body.websiteUrl,
          affiliateIdentifier: body.affiliateIdentifier,
          logoUrl: body.logoUrl,
        })
        .returning();

      await app.cache.bumpVersion("offers");
      return reply.code(201).send(created);
    },
  });

  app.get("/api/merchants", {
    preHandler: [requireAuth, requirePermission("manage_products")],
    schema: {
      description: "List merchants (admin)",
      response: {
        200: { type: "array", items: merchantSchema },
      },
    },
    handler: async () => db.select().from(merchants).orderBy(sql`${merchants.name} asc`),
  });

  app.get("/api/merchants/analytics", {
    preHandler: [requireAuth, requirePermission("manage_products")],
    schema: {
      description: "Merchant click analytics (admin)",
      querystring: {
        type: "object",
        properties: { days: { type: "string" } },
      },
      response: {
        200: {
          type: "object",
          properties: {
            since: { type: "string" },
            days: { type: "number" },
            totalClicks: { type: "number" },
            byMerchant: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  name: { type: "string" },
                  clicks: { type: "number" },
                },
                required: ["id", "name", "clicks"],
              },
            },
            byDay: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  day: { type: "string" },
                  clicks: { type: "number" },
                },
                required: ["day", "clicks"],
              },
            },
          },
          required: ["since", "days", "totalClicks", "byMerchant", "byDay"],
        },
      },
    },
    handler: async (request) => {
      const query = request.query as { days?: string };
      const daysRaw = Number(query.days || "30");
      const days = Number.isFinite(daysRaw) ? Math.min(365, Math.max(1, Math.floor(daysRaw))) : 30;
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const [totalRow] = await db
        .select({ count: sql<number>`count(*)`.mapWith(Number) })
        .from(merchantClicks)
        .where(gte(merchantClicks.clickedAt, since));

      const byMerchant = await db
        .select({
          id: merchants.id,
          name: merchants.name,
          clicks: sql<number>`coalesce(count(${merchantClicks.id}), 0)`.mapWith(Number),
        })
        .from(merchants)
        .leftJoin(
          merchantClicks,
          and(eq(merchantClicks.merchantId, merchants.id), gte(merchantClicks.clickedAt, since)),
        )
        .groupBy(merchants.id)
        .orderBy(sql`coalesce(count(${merchantClicks.id}), 0) desc`, sql`${merchants.name} asc`);

      const byDay = await db
        .select({
          day: sql<string>`to_char(date_trunc('day', ${merchantClicks.clickedAt}), 'YYYY-MM-DD')`,
          clicks: sql<number>`count(*)`.mapWith(Number),
        })
        .from(merchantClicks)
        .where(gte(merchantClicks.clickedAt, since))
        .groupBy(sql`date_trunc('day', ${merchantClicks.clickedAt})`)
        .orderBy(sql`date_trunc('day', ${merchantClicks.clickedAt})`);

      return {
        since: since.toISOString(),
        days,
        totalClicks: totalRow?.count ?? 0,
        byMerchant,
        byDay,
      };
    },
  });

  app.post("/api/merchants/:id/click", async (request, reply) => {
    const params = request.params as { id: string };
    const body = request.body as { productId?: string; targetUrl?: string; source?: string };

    const [merchant] = await db
      .select({ id: merchants.id })
      .from(merchants)
      .where(eq(merchants.id, params.id))
      .limit(1);

    if (!merchant) {
      return reply.code(404).send({ error: "Merchant not found" });
    }

    await db.insert(merchantClicks).values({
      merchantId: params.id,
      productId: body.productId,
      targetUrl: body.targetUrl,
      source: body.source,
      ipAddress: request.ip,
      userAgent: typeof request.headers["user-agent"] === "string" ? request.headers["user-agent"] : undefined,
    });

    return { ok: true };
  });

  app.get("/api/merchants/:id/redirect", async (request, reply) => {
    const params = request.params as { id: string };
    const query = request.query as { target?: string; productId?: string; source?: string };

    if (!query.target) {
      return reply.code(400).send({ error: "target is required" });
    }

    const [merchant] = await db
      .select({ id: merchants.id })
      .from(merchants)
      .where(eq(merchants.id, params.id))
      .limit(1);

    if (!merchant) {
      return reply.code(404).send({ error: "Merchant not found" });
    }

    await db.insert(merchantClicks).values({
      merchantId: params.id,
      productId: query.productId,
      targetUrl: query.target,
      source: query.source ?? "redirect",
      ipAddress: request.ip,
      userAgent: typeof request.headers["user-agent"] === "string" ? request.headers["user-agent"] : undefined,
    });

    return reply.redirect(query.target);
  });

  app.patch("/api/merchants/:id", {
    preHandler: [requireAuth, requirePermission("manage_products")],
    schema: {
      description: "Update merchant (admin)",
      params: {
        type: "object",
        properties: { id: { type: "string" } },
        required: ["id"],
      },
      body: {
        type: "object",
        properties: {
          name: { type: "string" },
          slug: { type: "string" },
          websiteUrl: { type: "string" },
          affiliateIdentifier: { type: "string" },
          logoUrl: { type: "string" },
        },
      },
      response: {
        200: merchantSchema,
        404: errorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const params = request.params as { id: string };
      const body = request.body as Partial<{
        name: string;
        slug: string;
        websiteUrl: string;
        affiliateIdentifier: string;
        logoUrl: string;
      }>;

      const [updated] = await db
        .update(merchants)
        .set(body)
        .where(eq(merchants.id, params.id))
        .returning();

      if (!updated) {
        return reply.code(404).send({ error: "Merchant not found" });
      }

      await app.cache.bumpVersion("offers");
      return updated;
    },
  });

  app.delete("/api/merchants/:id", {
    preHandler: [requireAuth, requirePermission("manage_products")],
    schema: {
      description: "Disable merchant (admin)",
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
      const [updated] = await db
        .update(merchants)
        .set({ status: "disabled" })
        .where(eq(merchants.id, params.id))
        .returning();
      if (!updated) {
        return reply.code(404).send({ error: "Merchant not found" });
      }
      await app.cache.bumpVersion("offers");
      return { ok: true };
    },
  });
}

