import type { FastifyInstance } from "fastify";
import { promises as fs } from "fs";
import { eq } from "drizzle-orm";
import { db } from "../../../db/index.js";
import { affiliatePrograms, merchants } from "../../../db/schema.js";
import { requireAuth } from "../../../middleware/requireAuth.js";
import { requirePermission } from "../../../middleware/requirePermission.js";
import { importAwinProgram } from "../../../awin/importer.js";
import { downloadFeed } from "../../../awin/feedDownloader.js";
import { maskSecret } from "../../../awin/utils.js";
import { FEED_FORMATS, NETWORKS } from "../constants/networks.js";
import { affiliateProgramSchema, errorResponseSchema } from "../schemas/affiliateSchemas.js";
import { getDatabaseErrorMessage, isDatabaseColumnMissing, isUniqueViolation } from "../services/validation.js";

type AffiliateNetwork = (typeof NETWORKS)[number];
type FeedFormat = (typeof FEED_FORMATS)[number];

export async function registerAffiliateProgramRoutes(app: FastifyInstance) {
  app.get("/api/admin/affiliate-programs", {
    preHandler: [requireAuth, requirePermission("manage_affiliates")],
    schema: {
      description: "List affiliate programs (admin)",
      response: {
        200: { type: "array", items: affiliateProgramSchema },
      },
    },
    handler: async () => {
      const rows = await db
        .select({
          id: affiliatePrograms.id,
          network: affiliatePrograms.network,
          programName: affiliatePrograms.programName,
          apiProgramId: affiliatePrograms.apiProgramId,
          merchantId: affiliatePrograms.merchantId,
          feedUrl: affiliatePrograms.feedUrl,
          feedFormat: affiliatePrograms.feedFormat,
          syncFrequencyHours: affiliatePrograms.syncFrequencyHours,
          lastSyncedAt: affiliatePrograms.lastSyncedAt,
          isActive: affiliatePrograms.isActive,
          merchantName: merchants.name,
        })
        .from(affiliatePrograms)
        .leftJoin(merchants, eq(affiliatePrograms.merchantId, merchants.id))
        .orderBy(affiliatePrograms.programName);

      return rows.map((row) => ({
        id: row.id,
        network: row.network,
        name: row.programName,
        apiProgramId: row.apiProgramId,
        merchantId: row.merchantId,
        merchantName: row.merchantName,
        feedFormat: row.feedFormat,
        syncFrequencyHours: row.syncFrequencyHours,
        lastSyncedAt: row.lastSyncedAt,
        isActive: row.isActive,
        feedUrlMasked: maskSecret(row.feedUrl),
        feedUrlSet: Boolean(row.feedUrl),
      }));
    },
  });

  app.get("/api/admin/affiliate-programs/:id", {
    preHandler: [requireAuth, requirePermission("manage_affiliates")],
    schema: {
      description: "Get affiliate program by id (admin)",
      params: {
        type: "object",
        properties: { id: { type: "string" } },
        required: ["id"],
      },
      response: {
        200: affiliateProgramSchema,
        404: errorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const params = request.params as { id: string };
      const [row] = await db
        .select({
          id: affiliatePrograms.id,
          network: affiliatePrograms.network,
          programName: affiliatePrograms.programName,
          apiProgramId: affiliatePrograms.apiProgramId,
          merchantId: affiliatePrograms.merchantId,
          feedUrl: affiliatePrograms.feedUrl,
          feedFormat: affiliatePrograms.feedFormat,
          syncFrequencyHours: affiliatePrograms.syncFrequencyHours,
          lastSyncedAt: affiliatePrograms.lastSyncedAt,
          isActive: affiliatePrograms.isActive,
          merchantName: merchants.name,
        })
        .from(affiliatePrograms)
        .leftJoin(merchants, eq(affiliatePrograms.merchantId, merchants.id))
        .where(eq(affiliatePrograms.id, params.id))
        .limit(1);

      if (!row) {
        return reply.code(404).send({ error: "Affiliate program not found" });
      }

      return {
        id: row.id,
        network: row.network,
        name: row.programName,
        apiProgramId: row.apiProgramId,
        merchantId: row.merchantId,
        merchantName: row.merchantName,
        feedFormat: row.feedFormat,
        syncFrequencyHours: row.syncFrequencyHours,
        lastSyncedAt: row.lastSyncedAt,
        isActive: row.isActive,
        feedUrlMasked: maskSecret(row.feedUrl),
        feedUrlSet: Boolean(row.feedUrl),
      };
    },
  });

  app.post("/api/admin/affiliate-programs", {
    preHandler: [requireAuth, requirePermission("manage_affiliates")],
    schema: {
      description: "Create affiliate program (admin)",
      body: {
        type: "object",
        properties: {
          name: { type: "string" },
          network: { type: "string" },
          apiProgramId: { type: "string" },
          merchantId: { type: "string" },
          feedUrl: { type: "string" },
          feedFormat: { type: "string" },
          syncFrequencyHours: { type: "number" },
          isActive: { type: "boolean" },
        },
        required: ["name", "network", "apiProgramId"],
      },
      response: {
        201: affiliateProgramSchema,
        400: errorResponseSchema,
        404: errorResponseSchema,
        409: errorResponseSchema,
        500: errorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const body = request.body as Partial<{
        name: string;
        network: string;
        apiProgramId: string;
        merchantId?: string;
        feedUrl?: string;
        feedFormat?: string;
        syncFrequencyHours?: number;
        isActive?: boolean;
      }>;

      if (!body?.name || !body?.network || !body?.apiProgramId) {
        return reply.code(400).send({ error: "name, network, and apiProgramId are required" });
      }

      const rawNetwork = body.network.toLowerCase();
      if (!NETWORKS.includes(rawNetwork as AffiliateNetwork)) {
        return reply.code(400).send({ error: "Unsupported network" });
      }
      const network = rawNetwork as AffiliateNetwork;

      const rawFeedFormat = body.feedFormat?.toLowerCase() ?? "zip_csv";
      if (!FEED_FORMATS.includes(rawFeedFormat as FeedFormat)) {
        return reply.code(400).send({ error: "Unsupported feed format" });
      }
      const feedFormat = rawFeedFormat as FeedFormat;

      if (body.merchantId) {
        const [merchant] = await db
          .select({ id: merchants.id })
          .from(merchants)
          .where(eq(merchants.id, body.merchantId))
          .limit(1);
        if (!merchant) {
          return reply.code(404).send({ error: "Merchant not found" });
        }
      }

      try {
        const [created] = await db
          .insert(affiliatePrograms)
          .values({
            network,
            programName: body.name,
            apiProgramId: body.apiProgramId,
            merchantId: body.merchantId ?? null,
            feedUrl: body.feedUrl?.trim() || null,
            feedFormat,
            syncFrequencyHours: body.syncFrequencyHours ?? 24,
            isActive: body.isActive ?? true,
          })
          .returning();

        return reply.code(201).send({
          id: created.id,
          network: created.network,
          name: created.programName,
          apiProgramId: created.apiProgramId,
          merchantId: created.merchantId,
          feedFormat: created.feedFormat,
          syncFrequencyHours: created.syncFrequencyHours,
          lastSyncedAt: created.lastSyncedAt,
          isActive: created.isActive,
          feedUrlMasked: maskSecret(created.feedUrl),
          feedUrlSet: Boolean(created.feedUrl),
        });
      } catch (error) {
        if (isUniqueViolation(error, "affiliate_programs_network_program_unique")) {
          return reply.code(409).send({ error: "Affiliate program already exists" });
        }
        if (isDatabaseColumnMissing(error)) {
          return reply.code(500).send({ error: getDatabaseErrorMessage(error) });
        }
        throw error;
      }
    },
  });

  app.patch("/api/admin/affiliate-programs/:id", {
    preHandler: [requireAuth, requirePermission("manage_affiliates")],
    schema: {
      description: "Update affiliate program (admin)",
      params: {
        type: "object",
        properties: { id: { type: "string" } },
        required: ["id"],
      },
      body: {
        type: "object",
        properties: {
          name: { type: "string" },
          apiProgramId: { type: "string" },
          merchantId: { type: ["string", "null"] },
          feedUrl: { type: ["string", "null"] },
          feedFormat: { type: "string" },
          syncFrequencyHours: { type: "number" },
          isActive: { type: "boolean" },
        },
      },
      response: {
        200: affiliateProgramSchema,
        400: errorResponseSchema,
        404: errorResponseSchema,
        500: errorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const params = request.params as { id: string };
      const body = request.body as Partial<{
        name: string;
        apiProgramId: string;
        merchantId?: string | null;
        feedUrl?: string | null;
        feedFormat?: string;
        syncFrequencyHours?: number;
        isActive?: boolean;
      }>;

      if (body.feedFormat) {
        const normalized = body.feedFormat.toLowerCase();
        if (!FEED_FORMATS.includes(normalized as FeedFormat)) {
          return reply.code(400).send({ error: "Unsupported feed format" });
        }
        body.feedFormat = normalized as FeedFormat;
      }

      if (body.merchantId) {
        const [merchant] = await db
          .select({ id: merchants.id })
          .from(merchants)
          .where(eq(merchants.id, body.merchantId))
          .limit(1);
        if (!merchant) {
          return reply.code(404).send({ error: "Merchant not found" });
        }
      }

      const updatePayload: Record<string, unknown> = {};
      if (body.name !== undefined) updatePayload.programName = body.name;
      if (body.apiProgramId !== undefined) updatePayload.apiProgramId = body.apiProgramId;
      if ("merchantId" in body) updatePayload.merchantId = body.merchantId ?? null;
      if ("feedUrl" in body) updatePayload.feedUrl = body.feedUrl?.trim() || null;
      if (body.feedFormat !== undefined) updatePayload.feedFormat = body.feedFormat;
      if (body.syncFrequencyHours !== undefined) updatePayload.syncFrequencyHours = body.syncFrequencyHours;
      if (body.isActive !== undefined) updatePayload.isActive = body.isActive;

      try {
        const [updated] = await db
          .update(affiliatePrograms)
          .set(updatePayload)
          .where(eq(affiliatePrograms.id, params.id))
          .returning();

        if (!updated) {
          return reply.code(404).send({ error: "Affiliate program not found" });
        }

        return {
          id: updated.id,
          network: updated.network,
          name: updated.programName,
          apiProgramId: updated.apiProgramId,
          merchantId: updated.merchantId,
          feedFormat: updated.feedFormat,
          syncFrequencyHours: updated.syncFrequencyHours,
          lastSyncedAt: updated.lastSyncedAt,
          isActive: updated.isActive,
          feedUrlMasked: maskSecret(updated.feedUrl),
          feedUrlSet: Boolean(updated.feedUrl),
        };
      } catch (error) {
        if (isDatabaseColumnMissing(error)) {
          return reply.code(500).send({ error: getDatabaseErrorMessage(error) });
        }
        throw error;
      }
    },
  });

  app.post("/api/admin/affiliate-programs/:id/sync", {
    preHandler: [requireAuth, requirePermission("manage_affiliates")],
    schema: {
      description: "Manually sync an affiliate program (AWIN only)",
      params: {
        type: "object",
        properties: { id: { type: "string" } },
        required: ["id"],
      },
      response: {
        200: {
          type: "object",
          properties: {
            ok: { type: "boolean" },
            result: { type: "object" },
          },
          required: ["ok", "result"],
        },
        400: errorResponseSchema,
        404: errorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const params = request.params as { id: string };
      const [program] = await db
        .select()
        .from(affiliatePrograms)
        .where(eq(affiliatePrograms.id, params.id))
        .limit(1);

      if (!program) {
        return reply.code(404).send({ error: "Affiliate program not found" });
      }

      if (program.network !== "awin") {
        return reply.code(400).send({ error: "Manual sync only supported for AWIN programs" });
      }

      const result = await importAwinProgram(program);
      if (result.status === "success") {
        await app.cache.bumpVersion("products");
        await app.cache.bumpVersion("offers");
      }
      return { ok: result.status === "success", result };
    },
  });

  app.post("/api/admin/affiliate-programs/:id/test-feed", {
    preHandler: [requireAuth, requirePermission("manage_affiliates")],
    schema: {
      description: "Validate affiliate program feed URL (admin)",
      params: {
        type: "object",
        properties: { id: { type: "string" } },
        required: ["id"],
      },
      response: {
        200: {
          type: "object",
          properties: {
            ok: { type: "boolean" },
            status: { type: "number" },
            bytes: { type: "number" },
          },
          required: ["ok", "status", "bytes"],
        },
        400: errorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const params = request.params as { id: string };
      const [program] = await db
        .select({ feedUrl: affiliatePrograms.feedUrl })
        .from(affiliatePrograms)
        .where(eq(affiliatePrograms.id, params.id))
        .limit(1);

      if (!program?.feedUrl) {
        return reply.code(400).send({ error: "Feed URL not configured" });
      }

      try {
        const download = await downloadFeed(program.feedUrl, {
          timeoutMs: 30_000,
          maxAttempts429: 1,
          maxAttempts5xx: 1,
          maxBytes: 1024 * 1024,
        });
        if (download.filePath) {
          await fs.unlink(download.filePath).catch(() => null);
        }
        return { ok: true, status: download.status, bytes: download.bytes };
      } catch (error) {
        return reply.code(400).send({ error: (error as Error).message });
      }
    },
  });
}

