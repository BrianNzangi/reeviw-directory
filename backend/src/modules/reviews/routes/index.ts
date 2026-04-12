import type { FastifyInstance } from "fastify";
import { registerReviewAdminRoutes } from "./admin.js";
import { registerReviewSubmissionRoutes } from "./submit.js";

export async function reviewsRoutes(app: FastifyInstance) {
  await registerReviewSubmissionRoutes(app);
  await registerReviewAdminRoutes(app);
}
