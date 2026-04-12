import type { FastifyInstance } from "fastify";
import { registerAmazonImportRoutes } from "./importCsv.js";

export async function amazonRoutes(app: FastifyInstance) {
  await registerAmazonImportRoutes(app);
}
