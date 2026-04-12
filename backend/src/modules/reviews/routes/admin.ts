import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import { db } from "../../../db/index.js";
import { reviews } from "../../../db/schema.js";
import { requireAuth } from "../../../middleware/requireAuth.js";
import { requirePermission } from "../../../middleware/requirePermission.js";
import { errorResponseSchema, reviewSchema } from "../schemas/reviewSchemas.js";

export async function registerReviewAdminRoutes(app: FastifyInstance) {
  app.post("/api/reviews/:id/approve", {
    preHandler: [requireAuth, requirePermission("moderate_reviews")],
    schema: {
      description: "Approve a review (admin)",
      params: {
        type: "object",
        properties: { id: { type: "string" } },
        required: ["id"],
      },
      response: {
        200: reviewSchema,
        404: errorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const params = request.params as { id: string };

      const [updated] = await db
        .update(reviews)
        .set({ status: "approved" })
        .where(eq(reviews.id, params.id))
        .returning();

      if (!updated) {
        return reply.code(404).send({ error: "Review not found" });
      }

      await app.cache.bumpVersion("reviews");
      return updated;
    },
  });
}

