import type { FastifyInstance } from "fastify";
import { and, eq } from "drizzle-orm";
import { db } from "../../../db/index.js";
import { reviews } from "../../../db/schema.js";
import { buildCacheKey, cacheTtls } from "../../../plugins/cache/index.js";
import { errorResponseSchema, reviewSchema } from "../schemas/publicSchemas.js";

export async function registerPublicReviewRoutes(app: FastifyInstance) {
  app.get("/api/public/reviews", {
    schema: {
      description: "List approved reviews for a product",
      querystring: {
        type: "object",
        properties: {
          productId: { type: "string" },
        },
        required: ["productId"],
      },
      response: {
        200: { type: "array", items: reviewSchema },
        400: errorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const query = request.query as { productId?: string };
      if (!query.productId) {
        return reply.code(400).send({ error: "productId is required" });
      }

      const versions = await app.cache.getVersions(["reviews"]);
      const cacheKey = buildCacheKey("cache:public:reviews", {
        vReviews: versions.reviews,
        productId: query.productId,
      });
      const cached = await app.cache.getJson<unknown[]>(cacheKey);
      if (cached) {
        return cached;
      }

      const rows = await db
        .select({
          id: reviews.id,
          productId: reviews.productId,
          title: reviews.title,
          content: reviews.content,
          rating: reviews.rating,
          createdAt: reviews.createdAt,
        })
        .from(reviews)
        .where(and(eq(reviews.productId, query.productId), eq(reviews.status, "approved")));
      await app.cache.setJson(cacheKey, rows, cacheTtls.publicLookup);
      return rows;
    },
  });
}

