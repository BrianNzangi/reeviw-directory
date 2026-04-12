import type { FastifyInstance } from "fastify";
import { registerAdminPageRoutes } from "./admin-pages.js";
import { registerAdminPostRoutes } from "./admin-posts.js";
import { registerPublicPageRoutes } from "./public-pages.js";
import { registerPublicPostRoutes } from "./public-posts.js";
import { registerTagRoutes } from "./tags.js";

export async function postsRoutes(app: FastifyInstance) {
  await registerAdminPageRoutes(app);
  await registerPublicPageRoutes(app);
  await registerTagRoutes(app);
  await registerPublicPostRoutes(app);
  await registerAdminPostRoutes(app);
}
