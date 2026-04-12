import type { FastifyInstance } from "fastify";
import { desc } from "drizzle-orm";
import { db } from "../../../db/index.js";
import { adCampaigns } from "../../../db/schema.js";

const DEFAULT_REFRESH_MINUTES = 60;
const LAST_SEEN_TTL_SECONDS = 60 * 60 * 24 * 30;
const LAST_SEEN_KEY = "cache:ads:last_created_at";

const toPositiveInt = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  if (parsed <= 0) return fallback;
  return Math.floor(parsed);
};

export function startAdsCacheMonitor(app: FastifyInstance) {
  if (!app.cache.enabled) {
    app.log.info("Ads cache monitor skipped; cache disabled");
    return;
  }

  const refreshMinutes = toPositiveInt(process.env.ADS_CACHE_REFRESH_MINUTES, DEFAULT_REFRESH_MINUTES);
  const intervalMs = refreshMinutes * 60 * 1000;
  let isRunning = false;
  let timer: NodeJS.Timeout | undefined;

  const checkForNewAds = async () => {
    if (isRunning) return;
    isRunning = true;

    try {
      const [latest] = await db
        .select({ createdAt: adCampaigns.createdAt })
        .from(adCampaigns)
        .orderBy(desc(adCampaigns.createdAt))
        .limit(1);

      if (!latest?.createdAt) {
        return;
      }

      const latestIso = latest.createdAt.toISOString();
      const cached = await app.cache.getJson<{ latestCreatedAt: string }>(LAST_SEEN_KEY);
      const lastSeen = cached?.latestCreatedAt;

      if (!lastSeen || latestIso > lastSeen) {
        await app.cache.setJson(LAST_SEEN_KEY, { latestCreatedAt: latestIso }, LAST_SEEN_TTL_SECONDS);
        await app.cache.bumpVersion("ads");
        app.log.info({ latestIso }, "Ads cache version bumped");
      }
    } catch (error) {
      app.log.warn({ error }, "Ads cache monitor failed");
    } finally {
      isRunning = false;
    }
  };

  void checkForNewAds();
  timer = setInterval(checkForNewAds, intervalMs);

  app.addHook("onClose", async () => {
    if (timer) {
      clearInterval(timer);
    }
  });
}
