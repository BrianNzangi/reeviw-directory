import type { FastifyInstance } from "fastify";
import { PAGE_SLUGS, type PageSlug } from "../constants/pageDefinitions.js";
import { ensurePage } from "../services/pages.js";
import { errorResponseSchema, postSchema } from "../schemas/postSchemas.js";

export async function registerPublicPageRoutes(app: FastifyInstance) {
  app.get("/api/pages/:slug", {
    schema: {
      description: "Get managed page by slug",
      params: {
        type: "object",
        properties: { slug: { type: "string" } },
        required: ["slug"],
      },
      response: {
        200: postSchema,
        404: errorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const params = request.params as { slug: string };
      const slug = params.slug as PageSlug;

      if (!PAGE_SLUGS.has(slug)) {
        return reply.code(404).send({ error: "Page not found" });
      }

      try {
        const page = await ensurePage(slug);
        if (!page) {
          return reply.code(404).send({ error: "Page not found" });
        }
        return page;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Page not available.";
        return reply.code(404).send({ error: message });
      }
    },
  });
}
