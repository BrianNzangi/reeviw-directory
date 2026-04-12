import type { FastifyInstance } from "fastify";
import { db } from "../../../db/index.js";
import { reviews } from "../../../db/schema.js";
import { requireAuth } from "../../../middleware/requireAuth.js";
import { errorResponseSchema, reviewSchema } from "../schemas/reviewSchemas.js";

export async function registerReviewSubmissionRoutes(app: FastifyInstance) {
  app.post("/api/products/:id/reviews", {
    preHandler: [requireAuth],
    schema: {
      description: "Submit a product review",
      params: {
        type: "object",
        properties: { id: { type: "string" } },
        required: ["id"],
      },
      body: {
        type: "object",
        properties: {
          title: { type: "string" },
          content: { type: "string" },
          rating: { type: "number" },
        },
        required: ["title", "content", "rating"],
      },
      response: {
        201: reviewSchema,
        400: errorResponseSchema,
        403: errorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const params = request.params as { id: string };
      const body = request.body as {
        title?: string;
        content?: string;
        rating?: number;
      };

      if (!body?.title || !body?.content || body.rating == null) {
        return reply.code(400).send({ error: "title, content, rating are required" });
      }

      const canSubmitByPermission = request.access?.permissions.includes("submit_review") ?? false;
      const isCustomer = request.access?.roleName === "customer";

      if (!canSubmitByPermission && !isCustomer) {
        return reply.code(403).send({ error: "Not allowed to submit review" });
      }

      const [created] = await db
        .insert(reviews)
        .values({
          productId: params.id,
          userId: request.authUser!.id,
          title: body.title,
          content: body.content,
          rating: body.rating.toString(),
        })
        .returning();

      await app.cache.bumpVersion("reviews");
      return reply.code(201).send(created);
    },
  });
}

