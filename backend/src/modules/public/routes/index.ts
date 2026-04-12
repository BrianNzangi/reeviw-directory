import type { FastifyInstance } from "fastify";
import { registerPublicCatalogRoutes } from "./catalog.js";
import { registerPublicPostRoutes } from "./posts.js";
import { registerPublicReviewRoutes } from "./reviews.js";

export async function publicRoutes(app: FastifyInstance) {
  await registerPublicCatalogRoutes(app);
  await registerPublicPostRoutes(app);
  await registerPublicReviewRoutes(app);
}
