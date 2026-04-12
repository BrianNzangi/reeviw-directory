import type { FastifyInstance } from "fastify";
import { and, eq } from "drizzle-orm";
import { db } from "../../../db/index.js";
import { posts } from "../../../db/schema.js";
import { requireAuth } from "../../../middleware/requireAuth.js";
import { requirePermission } from "../../../middleware/requirePermission.js";
import { PAGE_DEFINITIONS, PAGE_SLUGS, type PageSlug } from "../constants/pageDefinitions.js";
import { ensurePage } from "../services/pages.js";
import { errorResponseSchema, postSchema } from "../schemas/postSchemas.js";

export async function registerAdminPageRoutes(app: FastifyInstance) {
  app.get("/api/admin/pages", {
    preHandler: [requireAuth, requirePermission("manage_posts")],
    schema: {
      description: "List managed pages (admin)",
      response: {
        200: { type: "array", items: postSchema },
        409: errorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      try {
        const rows = await Promise.all(
          PAGE_DEFINITIONS.map((page) => ensurePage(page.slug, request.authUser?.id ?? null)),
        );
        return rows.filter(Boolean);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to load pages.";
        return reply.code(409).send({ error: message });
      }
    },
  });

  app.get("/api/admin/pages/:slug", {
    preHandler: [requireAuth, requirePermission("manage_posts")],
    schema: {
      description: "Get managed page by slug (admin)",
      params: {
        type: "object",
        properties: { slug: { type: "string" } },
        required: ["slug"],
      },
      response: {
        200: postSchema,
        404: errorResponseSchema,
        409: errorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const params = request.params as { slug: string };
      const slug = params.slug as PageSlug;
      if (!PAGE_SLUGS.has(slug)) {
        return reply.code(404).send({ error: "Page not found" });
      }
      try {
        const page = await ensurePage(slug, request.authUser?.id ?? null);
        if (!page) {
          return reply.code(404).send({ error: "Page not found" });
        }
        return page;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Page not available.";
        return reply.code(409).send({ error: message });
      }
    },
  });

  app.patch("/api/admin/pages/:slug", {
    preHandler: [requireAuth, requirePermission("manage_posts")],
    schema: {
      description: "Update managed page (admin)",
      params: {
        type: "object",
        properties: { slug: { type: "string" } },
        required: ["slug"],
      },
      body: {
        type: "object",
        properties: {
          title: { type: "string" },
          content: { type: "string" },
          coverImageUrl: { type: "string" },
          status: { type: "string" },
        },
      },
      response: {
        200: postSchema,
        404: errorResponseSchema,
        409: errorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const params = request.params as { slug: string };
      const slug = params.slug as PageSlug;
      if (!PAGE_SLUGS.has(slug)) {
        return reply.code(404).send({ error: "Page not found" });
      }

      const body = request.body as Partial<{
        title: string;
        content: string;
        coverImageUrl: string;
        status: "draft" | "published";
      }>;

      try {
        await ensurePage(slug, request.authUser?.id ?? null);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Page not available.";
        return reply.code(409).send({ error: message });
      }

      const updatePayload: Record<string, unknown> = { updatedAt: new Date() };
      if (body.title !== undefined) updatePayload.title = body.title;
      if (body.content !== undefined) updatePayload.content = body.content;
      if (body.coverImageUrl !== undefined) updatePayload.coverImageUrl = body.coverImageUrl;
      if (body.status !== undefined) updatePayload.status = body.status;

      const [updated] = await db
        .update(posts)
        .set(updatePayload)
        .where(and(eq(posts.slug, slug), eq(posts.postType, "page")))
        .returning();

      if (!updated) {
        return reply.code(404).send({ error: "Page not found" });
      }

      await app.cache.bumpVersion("posts");
      return updated;
    },
  });

  app.post("/api/admin/pages/:slug/publish", {
    preHandler: [requireAuth, requirePermission("publish_posts")],
    schema: {
      description: "Publish managed page (admin)",
      params: {
        type: "object",
        properties: { slug: { type: "string" } },
        required: ["slug"],
      },
      response: {
        200: postSchema,
        404: errorResponseSchema,
        409: errorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const params = request.params as { slug: string };
      const slug = params.slug as PageSlug;
      if (!PAGE_SLUGS.has(slug)) {
        return reply.code(404).send({ error: "Page not found" });
      }
      try {
        await ensurePage(slug, request.authUser?.id ?? null);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Page not available.";
        return reply.code(409).send({ error: message });
      }
      const [updated] = await db
        .update(posts)
        .set({
          status: "published",
          publishedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(and(eq(posts.slug, slug), eq(posts.postType, "page")))
        .returning();

      if (!updated) {
        return reply.code(404).send({ error: "Page not found" });
      }
      await app.cache.bumpVersion("posts");
      return updated;
    },
  });

  app.post("/api/admin/pages/:slug/unpublish", {
    preHandler: [requireAuth, requirePermission("publish_posts")],
    schema: {
      description: "Unpublish managed page (admin)",
      params: {
        type: "object",
        properties: { slug: { type: "string" } },
        required: ["slug"],
      },
      response: {
        200: postSchema,
        404: errorResponseSchema,
        409: errorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const params = request.params as { slug: string };
      const slug = params.slug as PageSlug;
      if (!PAGE_SLUGS.has(slug)) {
        return reply.code(404).send({ error: "Page not found" });
      }
      try {
        await ensurePage(slug, request.authUser?.id ?? null);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Page not available.";
        return reply.code(409).send({ error: message });
      }
      const [updated] = await db
        .update(posts)
        .set({
          status: "draft",
          publishedAt: null,
          updatedAt: new Date(),
        })
        .where(and(eq(posts.slug, slug), eq(posts.postType, "page")))
        .returning();

      if (!updated) {
        return reply.code(404).send({ error: "Page not found" });
      }
      await app.cache.bumpVersion("posts");
      return updated;
    },
  });
}

