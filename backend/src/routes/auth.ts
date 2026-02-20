import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { toNodeHandler } from "better-auth/node";
import { auth } from "../lib/auth.js";

export async function authRoutes(app: FastifyInstance) {
  const handler = toNodeHandler(auth);

  app.route({
    method: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    url: "/api/auth/*",
    config: {
      rateLimit: {
        max: 30,
        timeWindow: "1 minute",
      },
    },
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      await handler(request.raw, reply.raw);
      reply.hijack();
    },
  });
}
