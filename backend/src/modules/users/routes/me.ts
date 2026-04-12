import type { FastifyInstance } from "fastify";
import { requireAuth } from "../../../middleware/requireAuth.js";
import { sessionInfoSchema } from "../schemas/userSchemas.js";

export async function registerMeRoutes(app: FastifyInstance) {
  app.get("/api/me", {
    preHandler: [requireAuth],
    schema: {
      description: "Get current user session info",
      response: {
        200: sessionInfoSchema,
      },
    },
    handler: async (request) => {
      return {
        user: request.authUser,
        role: request.access?.roleName,
        permissions: request.access?.permissions ?? [],
      };
    },
  });
}

