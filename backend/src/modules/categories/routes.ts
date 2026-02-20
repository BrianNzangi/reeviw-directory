import { eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { db } from "../../db/index.js";
import { categories } from "../../db/schema.js";
import { requireAuth } from "../../middleware/requireAuth.js";
import { requirePermission } from "../../middleware/requirePermission.js";

export async function categoriesRoutes(app: FastifyInstance) {
  app.get("/api/categories", async () => {
    return db.select().from(categories);
  });

  app.post(
    "/api/categories",
    { preHandler: [requireAuth, requirePermission("manage_categories")] },
    async (request, reply) => {
      const body = request.body as { name?: string; slug?: string };
      if (!body?.name || !body?.slug) {
        return reply.code(400).send({ error: "name and slug are required" });
      }

      const [created] = await db
        .insert(categories)
        .values({ name: body.name, slug: body.slug })
        .onConflictDoNothing({ target: categories.slug })
        .returning();

      if (!created) {
        const [existing] = await db
          .select()
          .from(categories)
          .where(eq(categories.slug, body.slug))
          .limit(1);
        return reply.code(409).send({ error: "Category slug already exists", category: existing });
      }

      return reply.code(201).send(created);
    },
  );
}
