import { FastifyPluginAsync } from "fastify";

const csrfRoutes: FastifyPluginAsync = async (fastify) => {
  // Route to get CSRF token
  fastify.get("/api/csrf-token", {
    handler: async (request, reply) => {
      const token = reply.generateCsrf();
      return { csrfToken: token };
    }
  });

  // Example of protecting a specific route with CSRF
  fastify.post("/api/protected", {
    preHandler: fastify.csrfProtection,
    handler: async (request, reply) => {
      return { message: "This route is CSRF protected", data: request.body };
    }
  });

  // Example of protecting all routes with CSRF (global protection)
  // fastify.addHook('onRequest', fastify.csrfProtection);
};

export default csrfRoutes;