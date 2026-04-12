import type { FastifyInstance } from "fastify";
import { and, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { db } from "../../../db/index.js";
import { adCampaigns, adEvents, adSlots } from "../../../db/schema.js";
import { requireAuth } from "../../../middleware/requireAuth.js";
import { requirePermission } from "../../../middleware/requirePermission.js";
import {
  AD_SLOT_DEFINITIONS,
  PROVIDERS,
  getSlotCandidateGroups,
  getSlotDefinition,
  getSlotDefinitionForRequest,
} from "../constants/slots.js";
import { ensureAdSlots } from "../services/slots.js";
import { adAnalyticsSchema, adCampaignSchema, adSlotSchema, errorResponseSchema } from "../schemas/adSchemas.js";
import { normalizeConfig, normalizeDate, normalizeNumber, parseSizeLabel, validateSlotSize } from "../utils/validation.js";

type AdProvider = "sponsored" | "google_ads" | "mediavine";

type CampaignRow = {
  id: string;
  title: string;
  provider: AdProvider;
  slotId: string;
  width: number;
  height: number;
  priority: number;
  weight: number;
  isActive: boolean;
  startDate: string | Date | null;
  endDate: string | Date | null;
  configJson: unknown;
  createdAt: string | Date;
  slotSlug: string | null;
  slotDescription: string | null;
};

function serializeCampaign(row: CampaignRow) {
  const definition = row.slotSlug
    ? getSlotDefinitionForRequest(row.slotSlug, { width: row.width, height: row.height })
    : undefined;

  return {
    id: row.id,
    title: row.title,
    provider: row.provider,
    slotId: row.slotId,
    slotSlug: definition?.slug ?? row.slotSlug,
    slotName: definition?.name ?? null,
    slotDescription: definition?.description ?? row.slotDescription,
    width: row.width,
    height: row.height,
    priority: row.priority,
    weight: row.weight,
    isActive: row.isActive,
    startDate: row.startDate,
    endDate: row.endDate,
    config: (row.configJson ?? {}) as Record<string, unknown>,
    createdAt: row.createdAt,
  };
}

function aggregateAnalytics<T extends { slot: string; slotName: string | null; impressions: number; clicks: number }>(
  rows: T[],
) {
  const grouped = new Map<string, T>();

  for (const row of rows) {
    const existing = grouped.get(row.slot);
    if (existing) {
      existing.impressions += row.impressions;
      existing.clicks += row.clicks;
      continue;
    }
    grouped.set(row.slot, { ...row });
  }

  return Array.from(grouped.values())
    .map((row) => ({
      ...row,
      ctr: row.impressions ? Number((row.clicks / row.impressions).toFixed(4)) : 0,
    }))
    .sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions);
}

export async function registerAdAdminRoutes(app: FastifyInstance) {
  app.get("/api/admin/ad-slots", {
    preHandler: [requireAuth, requirePermission("manage_ads")],
    schema: {
      description: "List ad slots (admin)",
      response: {
        200: { type: "array", items: adSlotSchema },
      },
    },
    handler: async () => {
      await ensureAdSlots();
      const rows = await db.select().from(adSlots);
      const rowsBySlug = new Map(rows.map((row) => [row.slug, row] as const));

      return AD_SLOT_DEFINITIONS.map((definition) => {
        const row = rowsBySlug.get(definition.slug);
        if (!row) return null;

        return {
          id: row.id,
          slug: definition.slug,
          name: definition.name,
          description: definition.description,
          width: definition.width,
          height: definition.height,
          sizeLabel: definition.sizeLabel,
        };
      }).filter(Boolean);
    },
  });

  app.get("/api/admin/ad-campaigns", {
    preHandler: [requireAuth, requirePermission("manage_ads")],
    schema: {
      description: "List ad campaigns (admin)",
      querystring: {
        type: "object",
        properties: {
          slotId: { type: "string" },
          provider: { type: "string" },
          active: { type: "string" },
        },
      },
      response: {
        200: { type: "array", items: adCampaignSchema },
      },
    },
    handler: async (request) => {
      await ensureAdSlots();
      const query = request.query as { slotId?: string; provider?: AdProvider; active?: string };
      const conditions = [];

      if (query.slotId) conditions.push(eq(adCampaigns.slotId, query.slotId));
      if (query.provider) conditions.push(eq(adCampaigns.provider, query.provider));
      if (query.active) conditions.push(eq(adCampaigns.isActive, query.active === "true"));

      const rows = await db
        .select({
          id: adCampaigns.id,
          title: adCampaigns.title,
          provider: adCampaigns.provider,
          slotId: adCampaigns.slotId,
          width: adCampaigns.width,
          height: adCampaigns.height,
          priority: adCampaigns.priority,
          weight: adCampaigns.weight,
          isActive: adCampaigns.isActive,
          startDate: adCampaigns.startDate,
          endDate: adCampaigns.endDate,
          configJson: adCampaigns.configJson,
          createdAt: adCampaigns.createdAt,
          slotSlug: adSlots.slug,
          slotDescription: adSlots.description,
        })
        .from(adCampaigns)
        .leftJoin(adSlots, eq(adCampaigns.slotId, adSlots.id))
        .where(conditions.length ? and(...conditions) : undefined)
        .orderBy(desc(adCampaigns.createdAt));

      return rows.map(serializeCampaign);
    },
  });

  app.get("/api/admin/ad-campaigns/:id", {
    preHandler: [requireAuth, requirePermission("manage_ads")],
    schema: {
      description: "Get ad campaign by id (admin)",
      params: {
        type: "object",
        properties: { id: { type: "string" } },
        required: ["id"],
      },
      response: {
        200: adCampaignSchema,
        404: errorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      await ensureAdSlots();
      const params = request.params as { id: string };
      const [row] = await db
        .select({
          id: adCampaigns.id,
          title: adCampaigns.title,
          provider: adCampaigns.provider,
          slotId: adCampaigns.slotId,
          width: adCampaigns.width,
          height: adCampaigns.height,
          priority: adCampaigns.priority,
          weight: adCampaigns.weight,
          isActive: adCampaigns.isActive,
          startDate: adCampaigns.startDate,
          endDate: adCampaigns.endDate,
          configJson: adCampaigns.configJson,
          createdAt: adCampaigns.createdAt,
          slotSlug: adSlots.slug,
          slotDescription: adSlots.description,
        })
        .from(adCampaigns)
        .leftJoin(adSlots, eq(adCampaigns.slotId, adSlots.id))
        .where(eq(adCampaigns.id, params.id))
        .limit(1);

      if (!row) {
        return reply.code(404).send({ error: "Ad campaign not found" });
      }

      return serializeCampaign(row);
    },
  });

  app.post("/api/admin/ad-campaigns", {
    preHandler: [requireAuth, requirePermission("manage_ads")],
    schema: {
      description: "Create ad campaign (admin)",
      body: {
        type: "object",
        properties: {
          title: { type: "string" },
          provider: { type: "string" },
          slotId: { type: "string" },
          width: { type: "number" },
          height: { type: "number" },
          size: { type: "string" },
          priority: { type: "number" },
          weight: { type: "number" },
          isActive: { type: "boolean" },
          startDate: { type: ["string", "null"] },
          endDate: { type: ["string", "null"] },
          config: { type: "object" },
        },
        required: ["title", "provider", "slotId"],
      },
      response: {
        201: adCampaignSchema,
        400: errorResponseSchema,
        404: errorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      await ensureAdSlots();
      const body = request.body as Partial<{
        title: string;
        provider: AdProvider;
        slotId: string;
        width: number;
        height: number;
        size: string;
        priority: number;
        weight: number;
        isActive: boolean;
        startDate?: string | null;
        endDate?: string | null;
        config: Record<string, unknown>;
      }>;

      if (!body?.title?.trim() || !body.provider || !body.slotId) {
        return reply.code(400).send({ error: "title, provider, and slotId are required" });
      }

      if (!PROVIDERS.has(body.provider)) {
        return reply.code(400).send({ error: "Unsupported provider" });
      }
      const provider = body.provider as AdProvider;

      const [slot] = await db.select().from(adSlots).where(eq(adSlots.id, body.slotId)).limit(1);
      if (!slot) {
        return reply.code(404).send({ error: "Ad slot not found" });
      }

      let width = normalizeNumber(body.width, 0);
      let height = normalizeNumber(body.height, 0);
      if ((!width || !height) && body.size) {
        const parsed = parseSizeLabel(body.size);
        if (parsed) {
          width = parsed.width;
          height = parsed.height;
        }
      }

      if (!width || !height) {
        return reply.code(400).send({ error: "Ad size is required" });
      }

      if (!validateSlotSize(slot.slug, slot.device, width, height)) {
        return reply.code(400).send({ error: "Ad size does not match slot requirements" });
      }

      const normalized = normalizeConfig(provider, body.config);
      if ("error" in normalized) {
        return reply.code(400).send({ error: normalized.error });
      }

      const [created] = await db
        .insert(adCampaigns)
        .values({
          title: body.title.trim(),
          provider,
          slotId: body.slotId,
          width,
          height,
          priority: normalizeNumber(body.priority, 0),
          weight: Math.max(0, normalizeNumber(body.weight, 1)),
          isActive: body.isActive ?? true,
          startDate: normalizeDate(body.startDate) ?? undefined,
          endDate: normalizeDate(body.endDate) ?? undefined,
          configJson: normalized.value,
        })
        .returning();

      await app.cache.bumpVersion("ads");

      const definition = getSlotDefinition(slot.slug);
      return reply.code(201).send({
        id: created.id,
        title: created.title,
        provider: created.provider,
        slotId: created.slotId,
        slotSlug: definition?.slug ?? slot.slug,
        slotName: definition?.name ?? null,
        slotDescription: definition?.description ?? slot.description,
        width: created.width,
        height: created.height,
        priority: created.priority,
        weight: created.weight,
        isActive: created.isActive,
        startDate: created.startDate,
        endDate: created.endDate,
        config: created.configJson ?? {},
        createdAt: created.createdAt,
      });
    },
  });

  app.patch("/api/admin/ad-campaigns/:id", {
    preHandler: [requireAuth, requirePermission("manage_ads")],
    schema: {
      description: "Update ad campaign (admin)",
      params: {
        type: "object",
        properties: { id: { type: "string" } },
        required: ["id"],
      },
      body: {
        type: "object",
        properties: {
          title: { type: "string" },
          provider: { type: "string" },
          slotId: { type: "string" },
          width: { type: "number" },
          height: { type: "number" },
          size: { type: "string" },
          priority: { type: "number" },
          weight: { type: "number" },
          isActive: { type: "boolean" },
          startDate: { type: ["string", "null"] },
          endDate: { type: ["string", "null"] },
          config: { type: "object" },
        },
      },
      response: {
        200: adCampaignSchema,
        400: errorResponseSchema,
        404: errorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const params = request.params as { id: string };
      const body = request.body as Partial<{
        title: string;
        provider: AdProvider;
        slotId: string;
        width: number;
        height: number;
        size: string;
        priority: number;
        weight: number;
        isActive: boolean;
        startDate?: string | null;
        endDate?: string | null;
        config: Record<string, unknown>;
      }>;

      const [existing] = await db.select().from(adCampaigns).where(eq(adCampaigns.id, params.id)).limit(1);
      if (!existing) {
        return reply.code(404).send({ error: "Ad campaign not found" });
      }

      const nextProvider = (body.provider ?? existing.provider) as AdProvider;
      if (!PROVIDERS.has(nextProvider)) {
        return reply.code(400).send({ error: "Unsupported provider" });
      }

      if (body.provider && body.provider !== existing.provider && body.config === undefined) {
        return reply.code(400).send({ error: "Provider changes require updated config" });
      }

      const slotId = body.slotId ?? existing.slotId;
      const [slot] = await db.select().from(adSlots).where(eq(adSlots.id, slotId)).limit(1);
      if (!slot) {
        return reply.code(404).send({ error: "Ad slot not found" });
      }

      let width = body.width !== undefined ? normalizeNumber(body.width, existing.width) : existing.width;
      let height = body.height !== undefined ? normalizeNumber(body.height, existing.height) : existing.height;
      if ((body.width === undefined || body.height === undefined) && body.size) {
        const parsed = parseSizeLabel(body.size);
        if (parsed) {
          width = parsed.width;
          height = parsed.height;
        }
      }

      if (!validateSlotSize(slot.slug, slot.device, width, height)) {
        return reply.code(400).send({ error: "Ad size does not match slot requirements" });
      }

      let configValue = existing.configJson;
      if (body.config !== undefined) {
        const normalized = normalizeConfig(nextProvider, body.config);
        if ("error" in normalized) {
          return reply.code(400).send({ error: normalized.error });
        }
        configValue = normalized.value;
      }

      const updatePayload: Record<string, unknown> = {
        provider: nextProvider,
        slotId,
        width,
        height,
      };

      if (body.title !== undefined) updatePayload.title = body.title.trim();
      if (body.priority !== undefined) updatePayload.priority = normalizeNumber(body.priority, existing.priority);
      if (body.weight !== undefined) updatePayload.weight = Math.max(0, normalizeNumber(body.weight, existing.weight));
      if (body.isActive !== undefined) updatePayload.isActive = body.isActive;
      if ("startDate" in body) updatePayload.startDate = normalizeDate(body.startDate) ?? null;
      if ("endDate" in body) updatePayload.endDate = normalizeDate(body.endDate) ?? null;
      if (body.config !== undefined) updatePayload.configJson = configValue;

      const [updated] = await db
        .update(adCampaigns)
        .set(updatePayload)
        .where(eq(adCampaigns.id, params.id))
        .returning();

      if (!updated) {
        return reply.code(404).send({ error: "Ad campaign not found" });
      }

      await app.cache.bumpVersion("ads");

      const definition = getSlotDefinition(slot.slug);
      return {
        id: updated.id,
        title: updated.title,
        provider: updated.provider,
        slotId: updated.slotId,
        slotSlug: definition?.slug ?? slot.slug,
        slotName: definition?.name ?? null,
        slotDescription: definition?.description ?? slot.description,
        width: updated.width,
        height: updated.height,
        priority: updated.priority,
        weight: updated.weight,
        isActive: updated.isActive,
        startDate: updated.startDate,
        endDate: updated.endDate,
        config: updated.configJson ?? {},
        createdAt: updated.createdAt,
      };
    },
  });

  app.get("/api/admin/ad-analytics", {
    preHandler: [requireAuth, requirePermission("manage_ads")],
    schema: {
      description: "Ad performance analytics (admin)",
      querystring: {
        type: "object",
        properties: {
          days: { type: "string" },
          provider: { type: "string" },
          slot: { type: "string" },
        },
      },
      response: {
        200: adAnalyticsSchema,
      },
    },
    handler: async (request) => {
      const query = request.query as { days?: string; provider?: AdProvider; slot?: string };
      const daysRaw = Number(query.days || "30");
      const days = Number.isFinite(daysRaw) ? Math.min(365, Math.max(1, Math.floor(daysRaw))) : 30;
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const conditions = [gte(adEvents.createdAt, since)];
      if (query.provider) conditions.push(eq(adCampaigns.provider, query.provider));

      if (query.slot) {
        const definition = getSlotDefinition(query.slot);
        const candidateSlugs = Array.from(new Set(getSlotCandidateGroups(query.slot, null).flat()));
        conditions.push(inArray(adSlots.slug, candidateSlugs));
        if (definition) {
          conditions.push(eq(adCampaigns.width, definition.width));
          conditions.push(eq(adCampaigns.height, definition.height));
        }
      }

      const [totals] = await db
        .select({
          impressions: sql<number>`sum(case when ${adEvents.eventType} = 'impression' then 1 else 0 end)`.mapWith(Number),
          clicks: sql<number>`sum(case when ${adEvents.eventType} = 'click' then 1 else 0 end)`.mapWith(Number),
        })
        .from(adEvents)
        .innerJoin(adCampaigns, eq(adEvents.adId, adCampaigns.id))
        .innerJoin(adSlots, eq(adCampaigns.slotId, adSlots.id))
        .where(and(...conditions));

      const bySlotRows = await db
        .select({
          slotSlug: adSlots.slug,
          width: adCampaigns.width,
          height: adCampaigns.height,
          impressions: sql<number>`sum(case when ${adEvents.eventType} = 'impression' then 1 else 0 end)`.mapWith(Number),
          clicks: sql<number>`sum(case when ${adEvents.eventType} = 'click' then 1 else 0 end)`.mapWith(Number),
        })
        .from(adEvents)
        .innerJoin(adCampaigns, eq(adEvents.adId, adCampaigns.id))
        .innerJoin(adSlots, eq(adCampaigns.slotId, adSlots.id))
        .where(and(...conditions))
        .groupBy(adSlots.slug, adCampaigns.width, adCampaigns.height);

      const byCampaignRows = await db
        .select({
          id: adCampaigns.id,
          title: adCampaigns.title,
          provider: adCampaigns.provider,
          slotSlug: adSlots.slug,
          width: adCampaigns.width,
          height: adCampaigns.height,
          impressions: sql<number>`sum(case when ${adEvents.eventType} = 'impression' then 1 else 0 end)`.mapWith(Number),
          clicks: sql<number>`sum(case when ${adEvents.eventType} = 'click' then 1 else 0 end)`.mapWith(Number),
        })
        .from(adEvents)
        .innerJoin(adCampaigns, eq(adEvents.adId, adCampaigns.id))
        .innerJoin(adSlots, eq(adCampaigns.slotId, adSlots.id))
        .where(and(...conditions))
        .groupBy(adCampaigns.id, adSlots.slug, adCampaigns.width, adCampaigns.height)
        .orderBy(desc(sql`sum(case when ${adEvents.eventType} = 'click' then 1 else 0 end)`));

      const impressions = totals?.impressions ?? 0;
      const clicks = totals?.clicks ?? 0;
      const ctr = impressions ? Number((clicks / impressions).toFixed(4)) : 0;

      const bySlot = aggregateAnalytics(
        bySlotRows.map((row) => {
          const definition = getSlotDefinitionForRequest(row.slotSlug, { width: row.width, height: row.height });
          return {
            slot: definition?.slug ?? row.slotSlug,
            slotName: definition?.name ?? null,
            impressions: row.impressions ?? 0,
            clicks: row.clicks ?? 0,
          };
        }),
      );

      const byCampaign = byCampaignRows.map((row) => {
        const definition = getSlotDefinitionForRequest(row.slotSlug, { width: row.width, height: row.height });
        const rowImpressions = row.impressions ?? 0;
        const rowClicks = row.clicks ?? 0;
        return {
          id: row.id,
          title: row.title,
          provider: row.provider,
          slot: definition?.slug ?? row.slotSlug,
          slotName: definition?.name ?? null,
          impressions: rowImpressions,
          clicks: rowClicks,
          ctr: rowImpressions ? Number((rowClicks / rowImpressions).toFixed(4)) : 0,
        };
      });

      return {
        since: since.toISOString(),
        days,
        totalImpressions: impressions,
        totalClicks: clicks,
        ctr,
        bySlot,
        byCampaign,
      };
    },
  });
}
