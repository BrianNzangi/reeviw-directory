import Fastify from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import multipart from "@fastify/multipart";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import type { FastifyError } from "fastify";
import { categoriesRoutes } from "./modules/categories/routes.js";
import { jobsRoutes } from "./modules/jobs/routes.js";
import { postsRoutes } from "./modules/posts/routes.js";
import { reviewsRoutes } from "./modules/reviews/routes.js";
import { productsRoutes } from "./modules/products/routes.js";
import { usersRoutes } from "./modules/users/routes.js";
import { rbacRoutes } from "./modules/rbac/routes.js";
import { affiliatesRoutes } from "./modules/affiliates/routes.js";
import { amazonRoutes } from "./modules/amazon/routes.js";
import { adsRoutes } from "./modules/ads/routes.js";
import { uploadsRoutes } from "./modules/uploads/routes.js";
import { publicRoutes } from "./modules/public/routes.js";
import authRoutes from "./routes/auth.js";
import csrfRoutes from "./routes/csrf.routes.js";
import authPlugin from "./plugins/auth-plugin.js";
import csrfPlugin from "./plugins/csrf.js";
import { cachePlugin } from "./plugins/cache/index.js";

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

  app.register(multipart, {
    limits: {
      fileSize: 20 * 1024 * 1024,
    },
  });

  app.register(authPlugin);

  // Register CSRF protection
  app.register(csrfPlugin);
  app.register(cachePlugin);

  app.addHook("onRoute", (routeOptions) => {
    const url = routeOptions.url;
    if (!url || url.startsWith("/docs")) return;

    const schema = routeOptions.schema ?? {};
    if (schema.tags && schema.tags.length > 0) {
      routeOptions.schema = schema;
      return;
    }

    const tag =
      url.startsWith("/api/admin")
        ? "Admin"
        : url.startsWith("/api/auth")
          ? "Auth"
          : url.startsWith("/api/csrf")
            ? "Security"
            : url.startsWith("/api/jobs")
              ? "Jobs"
              : url.startsWith("/api/ads")
                ? "Ads"
                : url.startsWith("/api/public")
                  ? "Public"
                  : url.startsWith("/api/users") || url.startsWith("/api/me")
                    ? "Users"
                    : url.startsWith("/api/roles") ||
                        url.startsWith("/api/permissions") ||
                        url.startsWith("/api/role-permissions")
                      ? "RBAC"
                      : url.startsWith("/api/categories")
                        ? "Categories"
                        : url.startsWith("/api/products")
                          ? "Products"
                          : url.startsWith("/api/posts")
                            ? "Posts"
                            : url.startsWith("/api/tags")
                              ? "Tags"
                              : url.startsWith("/api/reviews")
                                ? "Reviews"
                                : url.startsWith("/api/merchants")
                                  ? "Merchants"
                                  : url.startsWith("/api/offers")
                                    ? "Offers"
                                    : url.startsWith("/health")
                                      ? "System"
                                      : url.startsWith("/api")
                                        ? "Other"
                                        : "Other";

    routeOptions.schema = { ...schema, tags: [tag] };
  });

  const enableSwagger = process.env.ENABLE_SWAGGER !== "false" && process.env.NODE_ENV !== "production";
  if (enableSwagger) {
    app.register(swagger, {
      openapi: {
        info: {
          title: "Bargainly Deals API",
          description: "Admin and public APIs for Bargainly Deals",
          version: "0.1.0",
        },
      },
    });

    app.register(swaggerUi, {
      routePrefix: "/docs",
      uiConfig: {
        docExpansion: "list",
        deepLinking: false,
      },
      staticCSP: true,
    });
  }

  app.get("/health", async () => ({ ok: true }));

  app.register(authRoutes);
  app.register(csrfRoutes);
  app.register(usersRoutes);
  app.register(rbacRoutes);
  app.register(categoriesRoutes);
  app.register(jobsRoutes);
  app.register(affiliatesRoutes);
  app.register(publicRoutes);
  app.register(adsRoutes);
  app.register(uploadsRoutes);
  app.register(amazonRoutes);
  app.register(productsRoutes);
  app.register(reviewsRoutes);
  app.register(postsRoutes);

  function mapDatabaseError(err: FastifyError) {
    const code = (err as { code?: string; cause?: { code?: string } })?.cause?.code || (err as { code?: string }).code;
    switch (code) {
      case "42703":
        return { statusCode: 500, message: "Database schema is out of date. Run migrations and try again." };
      case "23505":
        return { statusCode: 409, message: "Record already exists." };
      case "23503":
        return { statusCode: 409, message: "Referenced record not found." };
      case "23502":
        return { statusCode: 400, message: "Missing required field." };
      case "22P02":
        return { statusCode: 400, message: "Invalid input." };
      case "22001":
        return { statusCode: 400, message: "Value is too long." };
      default:
        return null;
    }
  }

  app.setErrorHandler((error: FastifyError, _request, reply) => {
    app.log.error(error);

    const mapped = mapDatabaseError(error);
    if (mapped) {
      return reply.status(mapped.statusCode).send({ error: mapped.message });
    }

    const statusCode = error.statusCode && error.statusCode >= 400 ? error.statusCode : 500;
    return reply.status(statusCode).send({
      error: statusCode === 500 ? "Internal server error" : error.message,
    });
  });

  return app;
}






