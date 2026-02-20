import Fastify from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import type { FastifyError } from "fastify";
import { affiliatesRoutes } from "./modules/affiliates/routes.js";
import { categoriesRoutes } from "./modules/categories/routes.js";
import { comparisonsRoutes } from "./modules/comparisons/routes.js";
import { postsRoutes } from "./modules/posts/routes.js";
import { reviewsRoutes } from "./modules/reviews/routes.js";
import { toolsRoutes } from "./modules/tools/routes.js";
import { usersRoutes } from "./modules/users/routes.js";
import { authRoutes } from "./routes/auth.js";

export function buildApp() {
  const app = Fastify({
    logger: true,
  });

  app.register(cors, {
    origin: true,
    credentials: true,
  });

  app.register(rateLimit, {
    global: false,
  });

  app.get("/health", async () => ({ ok: true }));

  app.register(authRoutes);
  app.register(usersRoutes);
  app.register(categoriesRoutes);
  app.register(toolsRoutes);
  app.register(affiliatesRoutes);
  app.register(comparisonsRoutes);
  app.register(reviewsRoutes);
  app.register(postsRoutes);

  app.setErrorHandler((error: FastifyError, _request, reply) => {
    app.log.error(error);
    const statusCode = error.statusCode && error.statusCode >= 400 ? error.statusCode : 500;
    reply.status(statusCode).send({
      error: statusCode === 500 ? "Internal server error" : error.message,
    });
  });

  return app;
}
