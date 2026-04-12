import { createReadStream, createWriteStream } from "node:fs";
import { promises as fs } from "node:fs";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { randomUUID } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { requireAuth } from "../../../middleware/requireAuth.js";
import { requirePermission } from "../../../middleware/requirePermission.js";
import { errorResponseSchema, uploadImageResponseSchema } from "../schemas/uploadSchemas.js";

const IMAGE_DIR = path.resolve(process.cwd(), "uploads", "images");

const IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/avif": ".avif",
};

export async function registerAdminUploadRoutes(app: FastifyInstance) {
  app.post("/api/admin/uploads/images", {
    preHandler: [requireAuth, requirePermission("manage_posts")],
    schema: {
      description: "Upload an image (admin)",
      consumes: ["multipart/form-data"],
      response: {
        200: uploadImageResponseSchema,
        400: errorResponseSchema,
        415: errorResponseSchema,
        500: errorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const file = await request.file();
      if (!file) {
        return reply.code(400).send({ error: "Image file is required." });
      }

      if (!IMAGE_MIME_TYPES.has(file.mimetype)) {
        return reply.code(415).send({ error: "Unsupported image type." });
      }

      await fs.mkdir(IMAGE_DIR, { recursive: true });

      const extension = EXTENSION_BY_MIME[file.mimetype] || path.extname(file.filename || "");
      const filename = `${randomUUID()}${extension}`;
      const targetPath = path.join(IMAGE_DIR, filename);

      try {
        await pipeline(file.file, createWriteStream(targetPath));
      } catch (error) {
        const message = error instanceof Error ? error.message : "Upload failed.";
        return reply.code(500).send({ error: message });
      }

      return {
        url: `/api/uploads/images/${filename}`,
        filename,
        mimeType: file.mimetype,
      };
    },
  });

  app.get<{ Params: { filename: string } }>("/api/uploads/images/:filename", {
    schema: {
      description: "Serve uploaded images",
      response: {
        404: errorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const filename = path.basename(request.params.filename);
      const filePath = path.join(IMAGE_DIR, filename);

      try {
        await fs.access(filePath);
      } catch {
        return reply.code(404).send({ error: "Image not found." });
      }

      const extension = path.extname(filename).toLowerCase();
      const mimeType = Object.entries(EXTENSION_BY_MIME)
        .find(([, ext]) => ext === extension)?.[0] || "application/octet-stream";

      reply.type(mimeType);
      return reply.send(createReadStream(filePath));
    },
  });
}
