import type { FastifyInstance } from "fastify";
import { desc, eq } from "drizzle-orm";
import { db } from "../../../db/index.js";
import { jobRuns } from "../../../db/schema.js";
import { requireAuth } from "../../../middleware/requireAuth.js";
import { requirePermission } from "../../../middleware/requirePermission.js";
import { jobRunSchema } from "../schemas/jobSchemas.js";

export async function registerJobStatusRoutes(app: FastifyInstance) {
  const jobKeys = ["amazon", "awin", "partnerstack", "impact", "all"] as const;

  app.get("/api/jobs/status", {
    preHandler: [requireAuth, requirePermission("manage_jobs")],
    schema: {
      description: "Get latest job run status (admin)",
      querystring: {
        type: "object",
        properties: { job: { type: "string" } },
      },
      response: {
        200: {
          oneOf: [
            {
              type: "object",
              properties: {
                job: { type: "string" },
                run: { anyOf: [jobRunSchema, { type: "null" }] },
              },
              required: ["job", "run"],
            },
            {
              type: "object",
              properties: {
                jobs: { type: "object", additionalProperties: { anyOf: [jobRunSchema, { type: "null" }] } },
              },
              required: ["jobs"],
            },
          ],
        },
      },
    },
    handler: async (request) => {
      const query = request.query as { job?: string };
      const job = typeof query.job === "string" ? query.job : undefined;

      if (job) {
        const [latest] = await db
          .select()
          .from(jobRuns)
          .where(eq(jobRuns.jobName, job))
          .orderBy(desc(jobRuns.startedAt))
          .limit(1);
        return { job, run: latest ?? null };
      }

      const entries = await Promise.all(
        jobKeys.map(async (jobName) => {
          const [latest] = await db
            .select()
            .from(jobRuns)
            .where(eq(jobRuns.jobName, jobName))
            .orderBy(desc(jobRuns.startedAt))
            .limit(1);
          return [jobName, latest ?? null] as const;
        }),
      );

      return { jobs: Object.fromEntries(entries) };
    },
  });
}

