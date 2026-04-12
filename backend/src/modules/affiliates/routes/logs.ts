import type { FastifyInstance } from "fastify";
import { and, desc, eq, gte, lte } from "drizzle-orm";
import { db } from "../../../db/index.js";
import { feedSyncLogs } from "../../../db/schema.js";
import { requireAuth } from "../../../middleware/requireAuth.js";
import { requirePermission } from "../../../middleware/requirePermission.js";
import { feedSyncLogSchema } from "../schemas/affiliateSchemas.js";
import { parseDateRange } from "../utils/dateRange.js";

type FeedSyncStatus = (typeof feedSyncLogs.$inferSelect)["status"];

export async function registerFeedLogRoutes(app: FastifyInstance) {
  app.get("/api/admin/feed-sync-logs", {
    preHandler: [requireAuth, requirePermission("manage_affiliates")],
    schema: {
      description: "List feed sync logs (admin)",
      querystring: {
        type: "object",
        properties: {
          network: { type: "string" },
          affiliate_program_id: { type: "string" },
          status: { type: "string" },
          date_range: { type: "string" },
        },
      },
      response: {
        200: { type: "array", items: feedSyncLogSchema },
      },
    },
    handler: async (request) => {
      const query = request.query as {
        network?: string;
        affiliate_program_id?: string;
        status?: string;
        date_range?: string;
      };

      const conditions = [];
      if (query.network) conditions.push(eq(feedSyncLogs.network, query.network));
      if (query.affiliate_program_id) {
        conditions.push(eq(feedSyncLogs.affiliateProgramId, query.affiliate_program_id));
      }
      const status = query.status as FeedSyncStatus | undefined;
      if (status) conditions.push(eq(feedSyncLogs.status, status));

      const range = parseDateRange(query.date_range);
      if (range?.from) conditions.push(gte(feedSyncLogs.startedAt, range.from));
      if (range?.to) conditions.push(lte(feedSyncLogs.startedAt, range.to));

      const rows = conditions.length
        ? await db
            .select()
            .from(feedSyncLogs)
            .where(and(...conditions))
            .orderBy(desc(feedSyncLogs.startedAt))
        : await db.select().from(feedSyncLogs).orderBy(desc(feedSyncLogs.startedAt));

      return rows;
    },
  });
}

