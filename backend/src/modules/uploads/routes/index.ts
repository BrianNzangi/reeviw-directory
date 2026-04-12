import type { FastifyInstance } from "fastify";
import { registerAdminUploadRoutes } from "./admin-uploads.js";

export async function uploadsRoutes(app: FastifyInstance) {
  await registerAdminUploadRoutes(app);
}
