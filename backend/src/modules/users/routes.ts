import type { FastifyInstance } from "fastify";
import { requireAuth } from "../../middleware/requireAuth.js";

export async function usersRoutes(app: FastifyInstance) {
  app.get("/api/me", { preHandler: [requireAuth] }, async (request) => {
    return {
      user: request.authUser,
      role: request.access?.roleName,
      permissions: request.access?.permissions ?? [],
    };
  });
}
