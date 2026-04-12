import type { FastifyInstance } from "fastify";
import { requireAuth } from "../../../middleware/requireAuth.js";
import { requirePermission } from "../../../middleware/requirePermission.js";
import { syncAmazon } from "../../../jobs/syncAmazon.js";
import { syncAwin } from "../../../jobs/syncAwin.js";
import { syncImpact } from "../../../jobs/syncImpact.js";
import { syncPartnerstack } from "../../../jobs/syncPartnerstack.js";
import { errorResponseSchema } from "../schemas/jobSchemas.js";
import { finishJobRun, startJobRun } from "../services/jobRuns.js";

export async function registerJobRunRoutes(app: FastifyInstance) {
  app.post("/api/jobs/amazon", {
    preHandler: [requireAuth, requirePermission("manage_jobs")],
    schema: {
      description: "Run Amazon sync job (admin)",
      response: {
        200: {
          type: "object",
          properties: { ok: { type: "boolean" }, runId: { type: "string" } },
          required: ["ok", "runId"],
        },
        500: errorResponseSchema,
      },
    },
    handler: async (_request, reply) => {
      const runId = await startJobRun("amazon");
      try {
        await syncAmazon();
        await finishJobRun(runId, "success");
        return { ok: true, runId };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Job failed.";
        await finishJobRun(runId, "failed", { errorMessage: message });
        return reply.code(500).send({ error: message });
      }
    },
  });

  app.post("/api/jobs/awin", {
    preHandler: [requireAuth, requirePermission("manage_jobs")],
    schema: {
      description: "Run AWIN sync job (admin)",
      response: {
        200: {
          type: "object",
          properties: {
            ok: { type: "boolean" },
            summary: { type: "object" },
            runId: { type: "string" },
          },
          required: ["ok", "summary", "runId"],
        },
        500: errorResponseSchema,
      },
    },
    handler: async (_request, reply) => {
      const runId = await startJobRun("awin");
      try {
        const summary = await syncAwin();
        await finishJobRun(runId, "success", { result: summary });
        return { ok: true, summary, runId };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Job failed.";
        await finishJobRun(runId, "failed", { errorMessage: message });
        return reply.code(500).send({ error: message });
      }
    },
  });

  app.post("/api/jobs/partnerstack", {
    preHandler: [requireAuth, requirePermission("manage_jobs")],
    schema: {
      description: "Run PartnerStack sync job (admin)",
      response: {
        200: {
          type: "object",
          properties: { ok: { type: "boolean" }, runId: { type: "string" } },
          required: ["ok", "runId"],
        },
        500: errorResponseSchema,
      },
    },
    handler: async (_request, reply) => {
      const runId = await startJobRun("partnerstack");
      try {
        await syncPartnerstack();
        await finishJobRun(runId, "success");
        return { ok: true, runId };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Job failed.";
        await finishJobRun(runId, "failed", { errorMessage: message });
        return reply.code(500).send({ error: message });
      }
    },
  });

  app.post("/api/jobs/impact", {
    preHandler: [requireAuth, requirePermission("manage_jobs")],
    schema: {
      description: "Run Impact sync job (admin)",
      response: {
        200: {
          type: "object",
          properties: { ok: { type: "boolean" }, runId: { type: "string" } },
          required: ["ok", "runId"],
        },
        500: errorResponseSchema,
      },
    },
    handler: async (_request, reply) => {
      const runId = await startJobRun("impact");
      try {
        await syncImpact();
        await finishJobRun(runId, "success");
        return { ok: true, runId };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Job failed.";
        await finishJobRun(runId, "failed", { errorMessage: message });
        return reply.code(500).send({ error: message });
      }
    },
  });

  app.post("/api/jobs/all", {
    preHandler: [requireAuth, requirePermission("manage_jobs")],
    schema: {
      description: "Run all sync jobs (admin)",
      response: {
        200: {
          type: "object",
          properties: {
            ok: { type: "boolean" },
            awin: { type: "object" },
            runId: { type: "string" },
          },
          required: ["ok", "awin", "runId"],
        },
        500: errorResponseSchema,
      },
    },
    handler: async (_request, reply) => {
      const runId = await startJobRun("all");
      try {
        await syncAmazon();
        const awin = await syncAwin();
        await syncPartnerstack();
        await syncImpact();
        await finishJobRun(runId, "success", { result: { awin } });
        return { ok: true, awin, runId };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Job failed.";
        await finishJobRun(runId, "failed", { errorMessage: message });
        return reply.code(500).send({ error: message });
      }
    },
  });
}

