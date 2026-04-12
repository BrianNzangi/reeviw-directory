import type { FastifyInstance } from "fastify";
import { registerMeRoutes } from "./me.js";

export async function usersRoutes(app: FastifyInstance) {
  await registerMeRoutes(app);
}
