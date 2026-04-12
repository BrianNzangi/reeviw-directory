import type { FastifyInstance } from "fastify";
import { registerCategoryAdminRoutes } from "./admin.js";
import { registerCategoryPublicRoutes } from "./public.js";

export async function categoriesRoutes(app: FastifyInstance) {
  await registerCategoryPublicRoutes(app);
  await registerCategoryAdminRoutes(app);
}
