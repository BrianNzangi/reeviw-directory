import { and, eq, ilike, inArray } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { db } from "../../db/index.js";
import { categories, toolCategories, tools } from "../../db/schema.js";
import { requireAuth } from "../../middleware/requireAuth.js";
import { requirePermission } from "../../middleware/requirePermission.js";

export async function toolsRoutes(app: FastifyInstance) {
  app.post(
    "/api/tools",
    { preHandler: [requireAuth, requirePermission("manage_tools")] },
    async (request, reply) => {
      const body = request.body as {
        name?: string;
        slug?: string;
        websiteUrl?: string;
        description?: string;
        categoryIds?: string[];
      };

      if (!body?.name || !body?.slug) {
        return reply.code(400).send({ error: "name and slug are required" });
      }

      const [created] = await db
        .insert(tools)
        .values({
          name: body.name,
          slug: body.slug,
          websiteUrl: body.websiteUrl,
          description: body.description,
          createdBy: request.authUser?.id,
        })
        .returning();

      if (body.categoryIds?.length) {
        await db.insert(toolCategories).values(
          body.categoryIds.map((categoryId) => ({
            toolId: created.id,
            categoryId,
          })),
        ).onConflictDoNothing();
      }

      return reply.code(201).send(created);
    },
  );

  app.patch(
    "/api/tools/:id",
    { preHandler: [requireAuth, requirePermission("manage_tools")] },
    async (request, reply) => {
      const params = request.params as { id: string };
      const body = request.body as Partial<{
        name: string;
        slug: string;
        websiteUrl: string;
        description: string;
        status: "draft" | "published";
      }>;

      const [updated] = await db
        .update(tools)
        .set({ ...body, updatedAt: new Date() })
        .where(eq(tools.id, params.id))
        .returning();

      if (!updated) {
        return reply.code(404).send({ error: "Tool not found" });
      }

      return updated;
    },
  );

  app.post(
    "/api/tools/:id/publish",
    { preHandler: [requireAuth, requirePermission("publish_tools")] },
    async (request, reply) => {
      const params = request.params as { id: string };

      const [updated] = await db
        .update(tools)
        .set({ status: "published", updatedAt: new Date() })
        .where(eq(tools.id, params.id))
        .returning();

      if (!updated) {
        return reply.code(404).send({ error: "Tool not found" });
      }

      return updated;
    },
  );

  app.get("/api/tools", async (request) => {
    const query = request.query as { q?: string; category?: string };

    let categoryToolIds: string[] | undefined;
    if (query.category) {
      const rows = await db
        .select({ toolId: toolCategories.toolId })
        .from(toolCategories)
        .innerJoin(categories, eq(toolCategories.categoryId, categories.id))
        .where(eq(categories.slug, query.category));

      categoryToolIds = rows.map((row) => row.toolId);
      if (categoryToolIds.length === 0) {
        return [];
      }
    }

    const conditions = [eq(tools.status, "published")];

    if (query.q) {
      conditions.push(ilike(tools.name, `%${query.q}%`));
    }

    if (categoryToolIds) {
      conditions.push(inArray(tools.id, categoryToolIds));
    }

    return db.select().from(tools).where(and(...conditions));
  });

  app.get("/api/tools/:slug", async (request, reply) => {
    const params = request.params as { slug: string };

    const [tool] = await db
      .select()
      .from(tools)
      .where(and(eq(tools.slug, params.slug), eq(tools.status, "published")))
      .limit(1);

    if (!tool) {
      return reply.code(404).send({ error: "Tool not found" });
    }

    const linkedCategories = await db
      .select({ id: categories.id, name: categories.name, slug: categories.slug })
      .from(toolCategories)
      .innerJoin(categories, eq(toolCategories.categoryId, categories.id))
      .where(eq(toolCategories.toolId, tool.id));

    return { ...tool, categories: linkedCategories };
  });
}
