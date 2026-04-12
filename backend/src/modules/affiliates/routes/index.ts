import type { FastifyInstance } from "fastify";
import { registerFeedLogRoutes } from "./logs.js";
import { registerAffiliateProgramRoutes } from "./programs.js";

export async function affiliatesRoutes(app: FastifyInstance) {
  await registerAffiliateProgramRoutes(app);
  await registerFeedLogRoutes(app);
}
