import type { FastifyInstance } from "fastify";
import { and, desc, eq, gte, inArray, isNull, lte, or } from "drizzle-orm";
import { db } from "../../../db/index.js";
import { adCampaigns, adEvents, adSlots } from "../../../db/schema.js";
import { buildCacheKey, cacheTtls } from "../../../plugins/cache/index.js";
import { buildClickref, appendClickref } from "../utils/clickref.js";
import { injectClickUrl, sanitizeSponsoredHtml } from "../utils/html.js";
import { pickWeighted } from "../utils/selection.js";
import { errorResponseSchema } from "../schemas/adSchemas.js";
import { ensureAdSlots } from "../services/slots.js";
import { getSlotCandidateGroups } from "../constants/slots.js";
import { parseSizeLabel, resolveSponsoredTarget } from "../utils/validation.js";

type CachedAdRow = {
  id: string;
  title: string;
  provider: string;
  slotId: string;
  width: number;
  height: number;
  priority: number;
  weight: number;
  configJson: unknown;
  slotSlug: string;
  slotDevice: string;
};

type CachedAdEntry = CachedAdRow[] | { empty: true };

export async function registerAdPublicRoutes(app: FastifyInstance) {
  app.get("/api/ads/serve", {
    schema: {
      description: "Serve an ad for a slot",
      querystring: {
        type: "object",
        properties: {
          slot: { type: "string" },
          device: { type: "string" },
          page_path: { type: "string" },
          exclude: { type: "string" },
          size: { type: "string" },
        },
        required: ["slot"],
      },
      response: {
        200: {
          oneOf: [
            {
              type: "object",
              properties: {
                id: { type: "string" },
                provider: { type: "string" },
                slot: {
                  type: "object",
                  properties: { slug: { type: "string" }, device: { type: "string" } },
                  required: ["slug", "device"],
                },
                width: { type: "number" },
                height: { type: "number" },
                renderMode: { type: "string" },
                html: { type: "string" },
                clickref: { type: "string" },
              },
              required: ["id", "provider", "slot", "width", "height", "renderMode", "html", "clickref"],
            },
            {
              type: "object",
              properties: {
                id: { type: "string" },
                provider: { type: "string" },
                slot: {
                  type: "object",
                  properties: { slug: { type: "string" }, device: { type: "string" } },
                  required: ["slug", "device"],
                },
                width: { type: "number" },
                height: { type: "number" },
                renderMode: { type: "string" },
                html: { type: "string" },
              },
              required: ["id", "provider", "slot", "width", "height", "renderMode", "html"],
            },
          ],
        },
        204: { type: "null" },
        400: errorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      await ensureAdSlots();
      const query = request.query as { slot?: string; device?: string; page_path?: string; exclude?: string; size?: string };
      const slotSlug = query.slot?.trim();
      const device = query.device?.trim() || "all";
      if (!slotSlug) {
        return reply.code(400).send({ error: "slot is required" });
      }

      const excludeIds = (query.exclude || "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);

      let sizeFilter: { width: number; height: number } | null = null;
      if (query.size) {
        const parsed = parseSizeLabel(query.size);
        if (!parsed) {
          return reply.code(400).send({ error: "Invalid size. Use WIDTHxHEIGHT." });
        }
        sizeFilter = parsed;
      }

      const versions = await app.cache.getVersions(["ads"]);
      const cacheKey = buildCacheKey("cache:ads:serve", {
        vAds: versions.ads,
        slot: slotSlug,
        size: sizeFilter ? `${sizeFilter.width}x${sizeFilter.height}` : "",
      });
      const cached = await app.cache.getJson<CachedAdEntry>(cacheKey);
      let rows: CachedAdRow[] = [];
      if (cached) {
        if (Array.isArray(cached)) {
          rows = cached;
        } else {
          return reply.code(204).send();
        }
      }

      const now = new Date();
      const baseConditions = [
        eq(adCampaigns.isActive, true),
        or(isNull(adCampaigns.startDate), lte(adCampaigns.startDate, now)),
        or(isNull(adCampaigns.endDate), gte(adCampaigns.endDate, now)),
      ];

      const selectRows = (slugGroup: string[]) =>
        db
          .select({
            id: adCampaigns.id,
            title: adCampaigns.title,
            provider: adCampaigns.provider,
            slotId: adCampaigns.slotId,
            width: adCampaigns.width,
            height: adCampaigns.height,
            priority: adCampaigns.priority,
            weight: adCampaigns.weight,
            configJson: adCampaigns.configJson,
            slotSlug: adSlots.slug,
            slotDevice: adSlots.device,
          })
          .from(adCampaigns)
          .innerJoin(adSlots, eq(adCampaigns.slotId, adSlots.id))
          .where(
            and(
              ...baseConditions,
              inArray(adSlots.slug, slugGroup),
              ...(sizeFilter ? [eq(adCampaigns.width, sizeFilter.width), eq(adCampaigns.height, sizeFilter.height)] : []),
            ),
          )
          .orderBy(desc(adCampaigns.priority));

      if (!rows.length) {
        const candidateGroups = getSlotCandidateGroups(slotSlug, sizeFilter);
        for (const group of candidateGroups) {
          rows = await selectRows(group);
          if (rows.length) {
            break;
          }
        }

        if (!rows.length) {
          await app.cache.setJson(cacheKey, { empty: true }, cacheTtls.adsServe);
          return reply.code(204).send();
        }
        await app.cache.setJson(cacheKey, rows, cacheTtls.adsServe);
      }

      let filteredRows = rows;
      if (excludeIds.length) {
        filteredRows = rows.filter((row) => !excludeIds.includes(row.id));
        if (filteredRows.length === 0) {
          filteredRows = rows;
        }
      }

      if (filteredRows.length === 0) {
        return reply.code(204).send();
      }

      const topPriority = filteredRows[0].priority;
      const candidates = filteredRows.filter((row) => row.priority === topPriority);
      const selected = pickWeighted(candidates, (row) => row.weight || 0);
      if (!selected) {
        return reply.code(204).send();
      }

      if (selected.provider === "sponsored") {
        const config = (selected.configJson ?? {}) as Record<string, any>;
        const clickref = buildClickref(selected.slotSlug, selected.id, query.page_path);
        const clickUrl = `/api/ads/${selected.id}/click?slot=${encodeURIComponent(selected.slotSlug)}&page_path=${encodeURIComponent(
          query.page_path || "",
        )}`;
        let html = "";
        if (typeof config?.html === "string" && config.html.trim()) {
          html = injectClickUrl(sanitizeSponsoredHtml(config.html), clickUrl);
        } else if (config?.imageUrl && config?.targetUrl) {
          html = `<a href="${clickUrl}" rel="sponsored"><img src="${config.imageUrl}" alt="${selected.title}" /></a>`;
        }

        return {
          id: selected.id,
          provider: selected.provider,
          slot: { slug: selected.slotSlug, device: selected.slotDevice || device },
          width: selected.width,
          height: selected.height,
          renderMode: "html",
          html,
          clickref,
        };
      }

      const config = (selected.configJson ?? {}) as Record<string, any>;
      return {
        id: selected.id,
        provider: selected.provider,
        slot: { slug: selected.slotSlug, device: selected.slotDevice || device },
        width: selected.width,
        height: selected.height,
        renderMode: selected.provider === "google_ads" ? "raw_script" : "container_script",
        html: typeof config.script === "string" ? config.script : "",
      };
    },
  });

  app.post("/api/ads/impression", {
    schema: {
      description: "Track an ad impression (sponsored only)",
      body: {
        type: "object",
        properties: {
          adId: { type: "string" },
          pagePath: { type: "string" },
          clickref: { type: "string" },
        },
        required: ["adId"],
      },
      response: {
        200: {
          type: "object",
          properties: {
            ok: { type: "boolean" },
            skipped: { type: "boolean" },
          },
          required: ["ok"],
        },
        400: errorResponseSchema,
        404: errorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const body = request.body as { adId?: string; pagePath?: string; clickref?: string };
      if (!body?.adId) {
        return reply.code(400).send({ error: "adId is required" });
      }

      const [ad] = await db
        .select({ id: adCampaigns.id, provider: adCampaigns.provider })
        .from(adCampaigns)
        .where(eq(adCampaigns.id, body.adId))
        .limit(1);

      if (!ad) {
        return reply.code(404).send({ error: "Ad campaign not found" });
      }

      if (ad.provider !== "sponsored") {
        return { ok: true, skipped: true };
      }

      await db.insert(adEvents).values({
        adId: body.adId,
        eventType: "impression",
        pagePath: body.pagePath ?? null,
        clickref: body.clickref ?? null,
      });

      return { ok: true };
    },
  });

  app.get("/api/ads/:id/click", {
    schema: {
      description: "Redirect through a sponsored ad click",
      params: {
        type: "object",
        properties: { id: { type: "string" } },
        required: ["id"],
      },
      querystring: {
        type: "object",
        properties: {
          slot: { type: "string" },
          page_path: { type: "string" },
        },
      },
      response: {
        302: { type: "null" },
        400: errorResponseSchema,
        404: errorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const params = request.params as { id: string };
      const query = request.query as { slot?: string; page_path?: string };

      const [row] = await db
        .select({
          id: adCampaigns.id,
          provider: adCampaigns.provider,
          configJson: adCampaigns.configJson,
          slotSlug: adSlots.slug,
        })
        .from(adCampaigns)
        .leftJoin(adSlots, eq(adCampaigns.slotId, adSlots.id))
        .where(eq(adCampaigns.id, params.id))
        .limit(1);

      if (!row) {
        return reply.code(404).send({ error: "Ad campaign not found" });
      }

      if (row.provider !== "sponsored") {
        return reply.code(400).send({ error: "Redirect only supported for sponsored ads" });
      }

      const slotSlug = row.slotSlug || query.slot || "unknown";
      const config = (row.configJson ?? {}) as Record<string, any>;
      const clickref = buildClickref(slotSlug, row.id, query.page_path);
      const target = resolveSponsoredTarget(config);
      if (!target) {
        return reply.code(400).send({ error: "Sponsored ad target missing" });
      }

      const append = config.appendClickref !== false;
      const finalUrl = append ? appendClickref(target, clickref) : target;

      await db.insert(adEvents).values({
        adId: row.id,
        eventType: "click",
        pagePath: query.page_path ?? null,
        clickref,
      });

      return reply.redirect(finalUrl);
    },
  });
}
