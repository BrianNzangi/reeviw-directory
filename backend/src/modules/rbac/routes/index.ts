import type { FastifyInstance } from "fastify";
import { registerPermissionAdminRoutes } from "./permissions.js";
import { registerRoleAdminRoutes } from "./roles.js";
import { registerUserAdminRoutes } from "./users.js";

export async function rbacRoutes(app: FastifyInstance) {
  await registerUserAdminRoutes(app);
  await registerRoleAdminRoutes(app);
  await registerPermissionAdminRoutes(app);
}
