import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import { db } from "../../../db/index.js";
import { tags } from "../../../db/schema.js";
import { requireAnyPermission } from "../../../middleware/requireAnyPermission.js";
import { requireAuth } from "../../../middleware/requireAuth.js";
import { buildCacheKey, cacheTtls } from "../../../plugins/cache/index.js";
import { errorResponseSchema, tagSchema } from "../schemas/postSchemas.js";
import { slugify } from "../utils/slugify.js";

export async function registerTagRoutes(app: FastifyInstance) {
  app.get("/api/tags", {
    schema: {
      description: "List tags",
      response: {
        200: { type: "array", items: tagSchema },
      },
    },
    handler: async () => {
      const versions = await app.cache.getVersions(["tags"]);
      const cacheKey = buildCacheKey("cache:tags", { v: versions.tags });
      const cached = await app.cache.getJson<unknown[]>(cacheKey);
      if (cached) {
        return cached;
      }

      const rows = await db.select().from(tags);
      await app.cache.setJson(cacheKey, rows, cacheTtls.publicList);
      return rows;
    },
  });

  app.post("/api/tags", {
    preHandler: [requireAuth, requireAnyPermission(["manage_products", "manage_posts"])],
    schema: {
      description: "Create a tag (admin)",
      body: {
        type: "object",
        properties: {
          name: { type: "string" },
          slug: { type: "string" },
        },
        required: ["name"],
      },
      response: {
        201: tagSchema,
        400: errorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const body = request.body as { name?: string; slug?: string };
      const name = body?.name?.trim();
      if (!name) {
        return reply.code(400).send({ error: "name is required" });
      }

      const slug = (body.slug ?? slugify(name)).trim();
      if (!slug) {
        return reply.code(400).send({ error: "slug is required" });
      }

      const [existing] = await db.select().from(tags).where(eq(tags.slug, slug)).limit(1);
      if (existing) {
        return reply.send(existing);
      }

      const [created] = await db.insert(tags).values({ name, slug }).returning();
      await app.cache.bumpVersion("tags");
      return reply.code(201).send(created);
    },
  });
}

