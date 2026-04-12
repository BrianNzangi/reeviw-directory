import type { FastifyInstance } from "fastify";
import { registerAdminProductRoutes } from "./admin-products.js";
import { registerMerchantRoutes } from "./merchants.js";
import { registerOfferRoutes } from "./offers.js";
import { registerPublicProductRoutes } from "./public-products.js";

export async function productsRoutes(app: FastifyInstance) {
  await registerPublicProductRoutes(app);
  await registerAdminProductRoutes(app);
  await registerMerchantRoutes(app);
  await registerOfferRoutes(app);
}
