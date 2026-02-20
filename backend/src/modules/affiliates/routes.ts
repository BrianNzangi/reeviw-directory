import { eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { db } from "../../db/index.js";
import { affiliateLinks, affiliatePrograms } from "../../db/schema.js";
import { requireAuth } from "../../middleware/requireAuth.js";
import { requirePermission } from "../../middleware/requirePermission.js";

export async function affiliatesRoutes(app: FastifyInstance) {
  app.post(
    "/api/affiliate/programs",
    { preHandler: [requireAuth, requirePermission("manage_affiliates")] },
    async (request, reply) => {
      const body = request.body as {
        network?: string;
        programName?: string;
        apiProgramId?: string;
        commissionType?: string;
        commissionRate?: number;
        recurring?: boolean;
      };

      if (!body?.network || !body?.programName || !body?.apiProgramId) {
        return reply.code(400).send({ error: "network, programName, apiProgramId are required" });
      }

      const [created] = await db
        .insert(affiliatePrograms)
        .values({
          network: body.network,
          programName: body.programName,
          apiProgramId: body.apiProgramId,
          commissionType: body.commissionType,
          commissionRate: body.commissionRate?.toString(),
          recurring: body.recurring ?? false,
        })
        .returning();

      return reply.code(201).send(created);
    },
  );

  app.post(
    "/api/tools/:id/affiliate-links",
    { preHandler: [requireAuth, requirePermission("manage_affiliates")] },
    async (request, reply) => {
      const params = request.params as { id: string };
      const body = request.body as {
        affiliateProgramId?: string;
        trackingUrl?: string;
        isPrimary?: boolean;
      };

      if (!body?.affiliateProgramId || !body?.trackingUrl) {
        return reply.code(400).send({ error: "affiliateProgramId and trackingUrl are required" });
      }

      const [program] = await db
        .select()
        .from(affiliatePrograms)
        .where(eq(affiliatePrograms.id, body.affiliateProgramId))
        .limit(1);

      if (!program) {
        return reply.code(404).send({ error: "Affiliate program not found" });
      }

      const [created] = await db
        .insert(affiliateLinks)
        .values({
          toolId: params.id,
          affiliateProgramId: body.affiliateProgramId,
          trackingUrl: body.trackingUrl,
          isPrimary: body.isPrimary ?? false,
        })
        .returning();

      return reply.code(201).send(created);
    },
  );
}
