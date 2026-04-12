import type { FastifyInstance } from "fastify";
import { registerManualProductRoutes } from "./manual-products.js";
import { registerJobStatusRoutes } from "./status.js";
import { registerJobRunRoutes } from "./run.js";

export async function jobsRoutes(app: FastifyInstance) {
  await registerManualProductRoutes(app);
  await registerJobStatusRoutes(app);
  await registerJobRunRoutes(app);
}
