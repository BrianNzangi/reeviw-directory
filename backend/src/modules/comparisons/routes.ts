import { and, eq, inArray } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { db } from "../../db/index.js";
import { comparisonTools, comparisons, tools } from "../../db/schema.js";
import { requireAuth } from "../../middleware/requireAuth.js";
import { requirePermission } from "../../middleware/requirePermission.js";

export async function comparisonsRoutes(app: FastifyInstance) {
  app.post(
    "/api/comparisons",
    { preHandler: [requireAuth, requirePermission("manage_comparisons")] },
    async (request, reply) => {
      const body = request.body as {
        title?: string;
        slug?: string;
        toolIds?: string[];
      };

      if (!body?.title || !body?.slug) {
        return reply.code(400).send({ error: "title and slug are required" });
      }

      const [created] = await db
        .insert(comparisons)
        .values({
          title: body.title,
          slug: body.slug,
          createdBy: request.authUser?.id,
        })
        .returning();

      if (body.toolIds?.length) {
        await db.insert(comparisonTools).values(
          body.toolIds.map((toolId) => ({
            comparisonId: created.id,
            toolId,
          })),
        ).onConflictDoNothing();
      }

      return reply.code(201).send(created);
    },
  );

  app.get("/api/comparisons/:slug", async (request, reply) => {
    const params = request.params as { slug: string };

    const [comparison] = await db
      .select()
      .from(comparisons)
      .where(and(eq(comparisons.slug, params.slug), eq(comparisons.status, "published")))
      .limit(1);

    if (!comparison) {
      return reply.code(404).send({ error: "Comparison not found" });
    }

    const linkedRows = await db
      .select({ toolId: comparisonTools.toolId })
      .from(comparisonTools)
      .where(eq(comparisonTools.comparisonId, comparison.id));

    const toolIds = linkedRows.map((row) => row.toolId);

    const linkedTools = toolIds.length
      ? await db.select().from(tools).where(and(eq(tools.status, "published"), inArray(tools.id, toolIds)))
      : [];

    return { ...comparison, tools: linkedTools };
  });
}
