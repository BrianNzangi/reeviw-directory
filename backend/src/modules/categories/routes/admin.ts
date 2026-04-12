import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import { db } from "../../../db/index.js";
import { categories } from "../../../db/schema.js";
import { requireAuth } from "../../../middleware/requireAuth.js";
import { requirePermission } from "../../../middleware/requirePermission.js";
import { categorySchema, errorResponseSchema } from "../schemas/categorySchemas.js";

export async function registerCategoryAdminRoutes(app: FastifyInstance) {
  app.post("/api/categories", {
    preHandler: [requireAuth, requirePermission("manage_categories")],
    schema: {
      description: "Create a category (admin)",
      body: {
        type: "object",
        properties: {
          name: { type: "string" },
          slug: { type: "string" },
          description: { type: ["string", "null"] },
          homepagePlacement: { type: ["string", "null"], enum: ["catalog", "home_collection", null] },
          parentId: { type: ["string", "null"] },
        },
        required: ["name", "slug"],
      },
      response: {
        201: categorySchema,
        400: errorResponseSchema,
        404: errorResponseSchema,
        409: {
          type: "object",
          properties: {
            error: { type: "string" },
            category: categorySchema,
          },
          required: ["error"],
        },
      },
    },
    handler: async (request, reply) => {
      const body = request.body as {
        name?: string;
        slug?: string;
        description?: string | null;
        homepagePlacement?: "catalog" | "home_collection" | null;
        parentId?: string | null;
      };
      if (!body?.name || !body?.slug) {
        return reply.code(400).send({ error: "name and slug are required" });
      }

      if (body.parentId) {
        const [parent] = await db.select().from(categories).where(eq(categories.id, body.parentId)).limit(1);
        if (!parent) {
          return reply.code(404).send({ error: "Parent category not found" });
        }
      }

      const createdRows = await db
        .insert(categories)
        .values({
          name: body.name,
          slug: body.slug,
          description: body.description ?? null,
          homepagePlacement: body.homepagePlacement ?? null,
          parentId: body.parentId ?? null,
        })
        .onConflictDoNothing({ target: categories.slug })
        .returning();

      const created = Array.isArray(createdRows) ? createdRows[0] : undefined;

      if (!created) {
        const [existing] = await db
          .select()
          .from(categories)
          .where(eq(categories.slug, body.slug))
          .limit(1);
        return reply.code(409).send({ error: "Category slug already exists", category: existing });
      }

      await app.cache.bumpVersion("categories");
      return reply.code(201).send(created);
    },
  });

  app.patch("/api/categories/:id", {
    preHandler: [requireAuth, requirePermission("manage_categories")],
    schema: {
      description: "Update a category (admin)",
      params: {
        type: "object",
        properties: { id: { type: "string" } },
        required: ["id"],
      },
      body: {
        type: "object",
        properties: {
          name: { type: "string" },
          slug: { type: "string" },
          description: { type: ["string", "null"] },
          homepagePlacement: { type: ["string", "null"], enum: ["catalog", "home_collection", null] },
          parentId: { type: ["string", "null"] },
        },
      },
      response: {
        200: categorySchema,
        400: errorResponseSchema,
        404: errorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const params = request.params as { id: string };
      const body = request.body as Partial<{
        name: string;
        slug: string;
        description: string | null;
        homepagePlacement: "catalog" | "home_collection" | null;
        parentId: string | null;
      }>;

      if (
        !("name" in body) &&
        !("slug" in body) &&
        !("description" in body) &&
        !("homepagePlacement" in body) &&
        !("parentId" in body)
      ) {
        return reply.code(400).send({ error: "name, slug, description, homepagePlacement, or parentId is required" });
      }

      if ("parentId" in body) {
        if (body.parentId === params.id) {
          return reply.code(400).send({ error: "Category cannot be its own parent" });
        }
        if (body.parentId) {
          const [parent] = await db.select().from(categories).where(eq(categories.id, body.parentId)).limit(1);
          if (!parent) {
            return reply.code(404).send({ error: "Parent category not found" });
          }
        }
      }

      const updatePayload: Partial<{ name: string; slug: string; description: string | null; parentId: string | null }> = {};
      if ("name" in body) updatePayload.name = body.name;
      if ("slug" in body) updatePayload.slug = body.slug;
      if ("description" in body) updatePayload.description = body.description ?? null;
      if ("homepagePlacement" in body) updatePayload.homepagePlacement = body.homepagePlacement ?? null;
      if ("parentId" in body) updatePayload.parentId = body.parentId ?? null;

      const [updated] = await db
        .update(categories)
        .set(updatePayload)
        .where(eq(categories.id, params.id))
        .returning();

      if (!updated) {
        return reply.code(404).send({ error: "Category not found" });
      }

      await app.cache.bumpVersion("categories");
      return updated;
    },
  });

  app.delete("/api/categories/:id", {
    preHandler: [requireAuth, requirePermission("manage_categories")],
    schema: {
      description: "Delete a category (admin)",
      params: {
        type: "object",
        properties: { id: { type: "string" } },
        required: ["id"],
      },
      response: {
        200: {
          type: "object",
          properties: { ok: { type: "boolean" } },
          required: ["ok"],
        },
        404: errorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const params = request.params as { id: string };
      const [deleted] = await db.delete(categories).where(eq(categories.id, params.id)).returning();
      if (!deleted) {
        return reply.code(404).send({ error: "Category not found" });
      }
      await app.cache.bumpVersion("categories");
      return { ok: true };
    },
  });
}

