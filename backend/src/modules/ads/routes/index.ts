import type { FastifyInstance } from "fastify";
import { registerAdAdminRoutes } from "./admin.js";
import { registerAdPublicRoutes } from "./public.js";
import { startAdsCacheMonitor } from "../services/cacheRefresh.js";

export async function adsRoutes(app: FastifyInstance) {
  await registerAdPublicRoutes(app);
  await registerAdAdminRoutes(app);
  startAdsCacheMonitor(app);
}
