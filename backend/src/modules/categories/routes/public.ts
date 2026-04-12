import type { FastifyInstance } from "fastify";
import { eq, sql } from "drizzle-orm";
import { db } from "../../../db/index.js";
import { categories } from "../../../db/schema.js";
import { buildCacheKey, cacheTtls } from "../../../plugins/cache/index.js";
import { categorySchema, errorResponseSchema } from "../schemas/categorySchemas.js";

export async function registerCategoryPublicRoutes(app: FastifyInstance) {
  app.get("/api/categories", {
    schema: {
      description: "List categories",
      querystring: {
        type: "object",
        properties: {
          homepagePlacement: { type: "string", enum: ["catalog", "home_collection"] },
        },
        additionalProperties: false,
      },
      response: {
        200: { type: "array", items: categorySchema },
      },
    },
    handler: async (request) => {
      const query = request.query as { homepagePlacement?: "catalog" | "home_collection" };
      const versions = await app.cache.getVersions(["categories", "posts"]);
      const cacheKey = buildCacheKey("cache:categories", {
        vCategories: versions.categories,
        vPosts: versions.posts,
        countLogic: "v3",
        placement: query.homepagePlacement ?? "all",
      });
      const cached = await app.cache.getJson<unknown[]>(cacheKey);
      if (cached) {
        return cached;
      }

      const rows = await db
        .select({
          id: categories.id,
          name: categories.name,
          slug: categories.slug,
          description: categories.description,
          homepagePlacement: categories.homepagePlacement,
          parentId: categories.parentId,
          createdAt: categories.createdAt,
          dealBlogsCount: sql<number>`
            (
              select count(*)::int
              from posts p
              where p.post_type <> 'page'
                and (
                  p.post_type = "categories"."slug"
                  or exists (
                    select 1
                    from post_categories pc
                    where pc.post_id = p.id
                      and pc.category_id = "categories"."id"
                  )
                )
            )
          `.mapWith(Number),
        })
        .from(categories)
        .where(query.homepagePlacement ? eq(categories.homepagePlacement, query.homepagePlacement) : undefined);

      await app.cache.setJson(cacheKey, rows, cacheTtls.publicList);
      return rows;
    },
  });

  app.get("/api/categories/:id", {
    schema: {
      description: "Get category by id",
      params: {
        type: "object",
        properties: { id: { type: "string" } },
        required: ["id"],
      },
      response: {
        200: categorySchema,
        404: errorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const params = request.params as { id: string };
      const versions = await app.cache.getVersions(["categories"]);
      const cacheKey = buildCacheKey("cache:category", { id: params.id, v: versions.categories });
      const cached = await app.cache.getJson<unknown>(cacheKey);
      if (cached) {
        return cached;
      }

      const [category] = await db.select().from(categories).where(eq(categories.id, params.id)).limit(1);
      if (!category) {
        return reply.code(404).send({ error: "Category not found" });
      }
      await app.cache.setJson(cacheKey, category, cacheTtls.publicDetail);
      return category;
    },
  });
}

