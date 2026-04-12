import type { FastifyInstance } from "fastify";
import { and, eq, ilike, inArray, sql } from "drizzle-orm";
import { db } from "../../../db/index.js";
import {
  categories,
  productCategories,
  productTags,
  products,
  tags,
} from "../../../db/schema.js";
import { requireAuth } from "../../../middleware/requireAuth.js";
import { requirePermission } from "../../../middleware/requirePermission.js";
import { loadOffersWithMerchants, loadPrimaryOffers } from "../services/offers.js";
import { loadProductTags } from "../services/tags.js";
import { errorResponseSchema, productSchema, tagSchema, categorySchema, offerSchema } from "../schemas/productSchemas.js";
import { isUniqueViolation } from "../utils/uniqueViolation.js";

export async function registerAdminProductRoutes(app: FastifyInstance) {
  app.post("/api/products", {
    preHandler: [requireAuth, requirePermission("manage_products")],
    schema: {
      description: "Create a product (admin)",
      body: {
        type: "object",
        properties: {
          name: { type: "string" },
          slug: { type: "string" },
          websiteUrl: { type: "string" },
          imageUrl: { type: "string" },
          status: { type: "string" },
          categoryIds: { type: "array", items: { type: "string" } },
          tagIds: { type: "array", items: { type: "string" } },
        },
        required: ["name", "slug"],
      },
      response: {
        201: productSchema,
        400: errorResponseSchema,
        409: errorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const body = request.body as {
        name?: string;
        slug?: string;
        websiteUrl?: string;
        imageUrl?: string;
        status?: "draft" | "published";
        categoryIds?: string[];
        tagIds?: string[];
      };

      if (!body?.name || !body?.slug) {
        return reply.code(400).send({ error: "name and slug are required" });
      }

      let created;
      try {
        [created] = await db
          .insert(products)
          .values({
            name: body.name,
            slug: body.slug,
            websiteUrl: body.websiteUrl,
            imageUrl: body.imageUrl,
            status: body.status ?? "draft",
            createdBy: request.authUser?.id,
          })
          .returning();
      } catch (error) {
        if (isUniqueViolation(error, "products_slug_unique")) {
          return reply.code(409).send("Product already exists");
        }
        throw error;
      }

      if (body.categoryIds?.length) {
        await db
          .insert(productCategories)
          .values(
            body.categoryIds.map((categoryId) => ({
              productId: created.id,
              categoryId,
            })),
          )
          .onConflictDoNothing();
      }

      if (body.tagIds?.length) {
        await db
          .insert(productTags)
          .values(
            body.tagIds.map((tagId) => ({
              productId: created.id,
              tagId,
            })),
          )
          .onConflictDoNothing();
      }

      await app.cache.bumpVersion("products");
      return reply.code(201).send(created);
    },
  });

  app.patch("/api/products/:id", {
    preHandler: [requireAuth, requirePermission("manage_products")],
    schema: {
      description: "Update a product (admin)",
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
          imageUrl: { type: "string" },
          status: { type: "string" },
          categoryIds: { type: "array", items: { type: "string" } },
          tagIds: { type: "array", items: { type: "string" } },
        },
      },
      response: {
        200: productSchema,
        404: errorResponseSchema,
        409: errorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const params = request.params as { id: string };
      const body = request.body as Partial<{
        name: string;
        slug: string;
        websiteUrl: string;
        imageUrl: string;
        status: "draft" | "published";
        categoryIds: string[];
        tagIds: string[];
      }>;

      const { categoryIds, tagIds, ...productFields } = body ?? {};

      let updated;
      try {
        [updated] = await db
          .update(products)
          .set({ ...productFields, updatedAt: new Date() })
          .where(eq(products.id, params.id))
          .returning();
      } catch (error) {
        if (isUniqueViolation(error, "products_slug_unique")) {
          return reply.code(409).send("Product already exists");
        }
        throw error;
      }

      if (!updated) {
        return reply.code(404).send({ error: "Product not found" });
      }

      if (Array.isArray(categoryIds)) {
        await db.delete(productCategories).where(eq(productCategories.productId, params.id));
        if (categoryIds.length) {
          await db
            .insert(productCategories)
            .values(
              categoryIds.map((categoryId) => ({
                productId: params.id,
                categoryId,
              })),
            )
            .onConflictDoNothing();
        }
      }

      if (Array.isArray(tagIds)) {
        await db.delete(productTags).where(eq(productTags.productId, params.id));
        if (tagIds.length) {
          await db
            .insert(productTags)
            .values(
              tagIds.map((tagId) => ({
                productId: params.id,
                tagId,
              })),
          )
          .onConflictDoNothing();
        }
      }

      await app.cache.bumpVersion("products");
      return updated;
    },
  });

  app.post("/api/products/:id/publish", {
    preHandler: [requireAuth, requirePermission("publish_products")],
    schema: {
      description: "Publish a product (admin)",
      params: {
        type: "object",
        properties: { id: { type: "string" } },
        required: ["id"],
      },
      response: {
        200: productSchema,
        404: errorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const params = request.params as { id: string };

      const [updated] = await db
        .update(products)
        .set({ status: "published", updatedAt: new Date() })
        .where(eq(products.id, params.id))
        .returning();

      if (!updated) {
        return reply.code(404).send({ error: "Product not found" });
      }

      await app.cache.bumpVersion("products");
      return updated;
    },
  });

  app.post("/api/products/bulk-delete", {
    preHandler: [requireAuth, requirePermission("manage_products")],
    schema: {
      description: "Delete multiple products (admin)",
      body: {
        type: "object",
        properties: {
          ids: {
            type: "array",
            items: { type: "string" },
            minItems: 1,
          },
        },
        required: ["ids"],
      },
      response: {
        200: {
          type: "object",
          properties: {
            ok: { type: "boolean" },
            deletedCount: { type: "number" },
          },
          required: ["ok", "deletedCount"],
        },
        400: errorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const body = request.body as { ids?: string[] };
      const ids = Array.from(new Set((body?.ids || []).filter(Boolean)));

      if (!ids.length) {
        return reply.code(400).send({ error: "ids is required" });
      }

      const deleted = await db
        .delete(products)
        .where(inArray(products.id, ids))
        .returning({ id: products.id });

      if (deleted.length > 0) {
        await app.cache.bumpVersion("products");
      }

      return { ok: true, deletedCount: deleted.length };
    },
  });

  app.delete("/api/products/:id", {
    preHandler: [requireAuth, requirePermission("manage_products")],
    schema: {
      description: "Delete a product (admin)",
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
      const [deleted] = await db.delete(products).where(eq(products.id, params.id)).returning();
      if (!deleted) {
        return reply.code(404).send({ error: "Product not found" });
      }
      await app.cache.bumpVersion("products");
      return { ok: true };
    },
  });

  app.get("/api/admin/products", {
    preHandler: [requireAuth, requirePermission("manage_products")],
    schema: {
      description: "List products (admin)",
      querystring: {
        type: "object",
        properties: {
          q: { type: "string" },
          status: { type: "string" },
          categoryId: { type: "string" },
          category: { type: "string" },
        },
      },
      response: {
        200: {
          type: "array",
          items: {
            type: "object",
            properties: {
              ...productSchema.properties,
              primaryOffer: { anyOf: [offerSchema, { type: "null" }] },
              tags: { type: "array", items: tagSchema },
            },
          },
        },
      },
    },
    handler: async (request) => {
      const query = request.query as {
        q?: string;
        status?: "draft" | "published";
        categoryId?: string;
        category?: string;
      };
      const conditions = [];

      let categoryProductIds: string[] | undefined;
      if (query.categoryId) {
        const rows = await db
          .select({ productId: productCategories.productId })
          .from(productCategories)
          .where(eq(productCategories.categoryId, query.categoryId));
        categoryProductIds = rows.map((row) => row.productId);
        if (categoryProductIds.length === 0) {
          return [];
        }
      }

      if (query.category) {
        const rows = await db
          .select({ productId: productCategories.productId })
          .from(productCategories)
          .innerJoin(categories, eq(productCategories.categoryId, categories.id))
          .where(eq(categories.slug, query.category));
        categoryProductIds = rows.map((row) => row.productId);
        if (categoryProductIds.length === 0) {
          return [];
        }
      }

      if (query.q) {
        conditions.push(ilike(products.name, `%${query.q}%`));
      }
      if (query.status) {
        conditions.push(eq(products.status, query.status));
      }
      if (categoryProductIds) {
        conditions.push(inArray(products.id, categoryProductIds));
      }

      const rows = conditions.length
        ? await db.select().from(products).where(and(...conditions)).orderBy(sql`${products.updatedAt} desc`)
        : await db.select().from(products).orderBy(sql`${products.updatedAt} desc`);

      const productIds = rows.map((row) => row.id);
      const primaryOffers = await loadPrimaryOffers(productIds);
      const tagMap = await loadProductTags(productIds);

      return rows.map((row) => ({
        ...row,
        primaryOffer: primaryOffers.get(row.id) || null,
        tags: tagMap.get(row.id) || [],
      }));
    },
  });

  app.get("/api/admin/products/count", {
    preHandler: [requireAuth, requirePermission("manage_products")],
    schema: {
      description: "Get product count (admin)",
      response: {
        200: {
          type: "object",
          properties: { count: { type: "number" } },
          required: ["count"],
        },
      },
    },
    handler: async () => {
      const [row] = await db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(products);
      return { count: row?.count ?? 0 };
    },
  });

  app.get("/api/admin/products/:id", {
    preHandler: [requireAuth, requirePermission("manage_products")],
    schema: {
      description: "Get product detail (admin)",
      params: {
        type: "object",
        properties: { id: { type: "string" } },
        required: ["id"],
      },
      response: {
        200: {
          type: "object",
          properties: {
            ...productSchema.properties,
            categories: { type: "array", items: categorySchema },
            tags: { type: "array", items: tagSchema },
            offers: { type: "array", items: offerSchema },
          },
        },
        404: errorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const params = request.params as { id: string };
      const [product] = await db.select().from(products).where(eq(products.id, params.id)).limit(1);
      if (!product) {
        return reply.code(404).send({ error: "Product not found" });
      }

      const linkedCategories = await db
        .select({
          id: categories.id,
          name: categories.name,
          slug: categories.slug,
          parentId: categories.parentId,
          homepagePlacement: categories.homepagePlacement,
        })
        .from(productCategories)
        .innerJoin(categories, eq(productCategories.categoryId, categories.id))
        .where(eq(productCategories.productId, product.id));

      const linkedTags = await db
        .select({ id: tags.id, name: tags.name, slug: tags.slug })
        .from(productTags)
        .innerJoin(tags, eq(productTags.tagId, tags.id))
        .where(eq(productTags.productId, product.id));

      const offers = await loadOffersWithMerchants(product.id, true);

      return { ...product, categories: linkedCategories, tags: linkedTags, offers };
    },
  });
}

