import type { FastifyInstance } from "fastify";
import { and, eq, ilike, inArray } from "drizzle-orm";
import { db } from "../../../db/index.js";
import { categories, productCategories, productTags, products, tags } from "../../../db/schema.js";
import { buildCacheKey, cacheTtls } from "../../../plugins/cache/index.js";
import { loadOffersWithMerchants, loadPrimaryOffers } from "../services/offers.js";
import { loadProductTags } from "../services/tags.js";
import { categorySchema, productSchema, tagSchema, errorResponseSchema, offerSchema } from "../schemas/publicSchemas.js";

export async function registerPublicCatalogRoutes(app: FastifyInstance) {
  app.get("/api/public/categories", {
    schema: {
      description: "List all categories",
      response: {
        200: { type: "array", items: categorySchema },
      },
    },
    handler: async () => {
      const versions = await app.cache.getVersions(["categories"]);
      const cacheKey = buildCacheKey("cache:public:categories", { v: versions.categories });
      const cached = await app.cache.getJson<unknown[]>(cacheKey);
      if (cached) {
        return cached;
      }

      const rows = await db.select().from(categories);
      await app.cache.setJson(cacheKey, rows, cacheTtls.publicList);
      return rows;
    },
  });

  app.get("/api/public/tags", {
    schema: {
      description: "List all tags",
      response: {
        200: { type: "array", items: tagSchema },
      },
    },
    handler: async () => {
      const versions = await app.cache.getVersions(["tags"]);
      const cacheKey = buildCacheKey("cache:public:tags", { v: versions.tags });
      const cached = await app.cache.getJson<unknown[]>(cacheKey);
      if (cached) {
        return cached;
      }

      const rows = await db.select().from(tags);
      await app.cache.setJson(cacheKey, rows, cacheTtls.publicList);
      return rows;
    },
  });

  app.get("/api/public/products", {
    schema: {
      description: "List published products",
      querystring: {
        type: "object",
        properties: {
          q: { type: "string" },
          category: { type: "string" },
          tag: { type: "string" },
        },
      },
      response: {
        200: { type: "array", items: productSchema },
      },
    },
    handler: async (request) => {
      const query = request.query as { q?: string; category?: string; tag?: string };
      const versions = await app.cache.getVersions(["products", "categories", "tags", "offers"]);
      const cacheKey = buildCacheKey("cache:public:products", {
        vProducts: versions.products,
        vCategories: versions.categories,
        vTags: versions.tags,
        vOffers: versions.offers,
        q: query.q ?? "",
        category: query.category ?? "",
        tag: query.tag ?? "",
      });
      const cached = await app.cache.getJson<unknown[]>(cacheKey);
      if (cached) {
        return cached;
      }

      let categoryProductIds: string[] | undefined;
      if (query.category) {
        const rows = await db
          .select({ productId: productCategories.productId })
          .from(productCategories)
          .innerJoin(categories, eq(productCategories.categoryId, categories.id))
          .where(eq(categories.slug, query.category));

        categoryProductIds = rows.map((row) => row.productId);
        if (categoryProductIds.length === 0) {
          await app.cache.setJson(cacheKey, [], cacheTtls.publicList);
          return [];
        }
      }

      let tagProductIds: string[] | undefined;
      if (query.tag) {
        const rows = await db
          .select({ productId: productTags.productId })
          .from(productTags)
          .innerJoin(tags, eq(productTags.tagId, tags.id))
          .where(eq(tags.slug, query.tag));
        tagProductIds = rows.map((row) => row.productId);
        if (tagProductIds.length === 0) {
          await app.cache.setJson(cacheKey, [], cacheTtls.publicList);
          return [];
        }
      }

      const conditions = [eq(products.status, "published")];

      if (query.q) {
        conditions.push(ilike(products.name, `%${query.q}%`));
      }

      if (categoryProductIds) {
        conditions.push(inArray(products.id, categoryProductIds));
      }

      if (tagProductIds) {
        conditions.push(inArray(products.id, tagProductIds));
      }

      const rows = await db.select().from(products).where(and(...conditions));
      const productIds = rows.map((row) => row.id);
      const primaryOffers = await loadPrimaryOffers(productIds);
      const tagMap = await loadProductTags(productIds);

      const payload = rows.map((row) => ({
        ...row,
        primaryOffer: primaryOffers.get(row.id) || null,
        tags: tagMap.get(row.id) || [],
      }));
      await app.cache.setJson(cacheKey, payload, cacheTtls.publicList);
      return payload;
    },
  });

  app.get("/api/public/products/:slug", {
    schema: {
      description: "Get a published product by slug",
      params: {
        type: "object",
        properties: { slug: { type: "string" } },
        required: ["slug"],
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
      const params = request.params as { slug: string };
      const versions = await app.cache.getVersions(["products", "categories", "tags", "offers"]);
      const cacheKey = buildCacheKey("cache:public:product", {
        slug: params.slug,
        vProducts: versions.products,
        vCategories: versions.categories,
        vTags: versions.tags,
        vOffers: versions.offers,
      });
      const cached = await app.cache.getJson<unknown>(cacheKey);
      if (cached) {
        return cached;
      }

      const [product] = await db
        .select()
        .from(products)
        .where(and(eq(products.slug, params.slug), eq(products.status, "published")))
        .limit(1);

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

      const offers = await loadOffersWithMerchants(product.id);

      const payload = { ...product, categories: linkedCategories, tags: linkedTags, offers };
      await app.cache.setJson(cacheKey, payload, cacheTtls.publicDetail);
      return payload;
    },
  });
}

