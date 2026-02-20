import { eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { db } from "../../db/index.js";
import { reviews } from "../../db/schema.js";
import { requireAuth } from "../../middleware/requireAuth.js";
import { requirePermission } from "../../middleware/requirePermission.js";

export async function reviewsRoutes(app: FastifyInstance) {
  app.post("/api/tools/:id/reviews", { preHandler: [requireAuth] }, async (request, reply) => {
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
        toolId: params.id,
        userId: request.authUser!.id,
        title: body.title,
        content: body.content,
        rating: body.rating.toString(),
      })
      .returning();

    return reply.code(201).send(created);
  });

  app.post(
    "/api/reviews/:id/approve",
    { preHandler: [requireAuth, requirePermission("moderate_reviews")] },
    async (request, reply) => {
      const params = request.params as { id: string };

      const [updated] = await db
        .update(reviews)
        .set({ status: "approved" })
        .where(eq(reviews.id, params.id))
        .returning();

      if (!updated) {
        return reply.code(404).send({ error: "Review not found" });
      }

      return updated;
    },
  );
}
