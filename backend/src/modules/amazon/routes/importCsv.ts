import type { FastifyInstance } from "fastify";
import { requireAuth } from "../../../middleware/requireAuth.js";
import { requirePermission } from "../../../middleware/requirePermission.js";
import { importAmazonCsv } from "../../../amazon/csv-importer.js";
import { amazonImportSummarySchema, errorResponseSchema } from "../schemas/amazonSchemas.js";

export async function registerAmazonImportRoutes(app: FastifyInstance) {
  app.post("/api/admin/amazon/import-csv", {
    preHandler: [requireAuth, requirePermission("manage_products")],
    schema: {
      description: "Import Amazon CSV (admin)",
      consumes: ["multipart/form-data"],
      response: {
        200: amazonImportSummarySchema,
        400: errorResponseSchema,
        500: errorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      if (!process.env.AMAZON_ASSOCIATE_TAG) {
        return reply.code(400).send({ error: "AMAZON_ASSOCIATE_TAG is required." });
      }

      const file = await request.file();
      if (!file) {
        return reply.code(400).send({ error: "CSV file is required." });
      }

      if (!file.filename.toLowerCase().endsWith(".csv")) {
        return reply.code(400).send({ error: "Only .csv files are supported." });
      }

      try {
        const summary = await importAmazonCsv({ stream: file.file });
        await app.cache.bumpVersion("products");
        await app.cache.bumpVersion("offers");
        return summary;
      } catch (error) {
        const message = error instanceof Error ? error.message : "CSV import failed.";
        const status = message.toLowerCase().includes("csv exceeds maximum rows") ? 400 : 500;
        return reply.code(status).send({ error: message });
      }
    },
  });
}

