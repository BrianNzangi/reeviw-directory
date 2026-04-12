import "dotenv/config";
import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { createClient, type RedisClientType } from "redis";

export type CacheHelper = {
  enabled: boolean;
  getJson: <T>(key: string) => Promise<T | null>;
  setJson: <T>(key: string, value: T, ttlSeconds: number) => Promise<void>;
  getVersion: (name: string) => Promise<number>;
  getVersions: (names: string[]) => Promise<Record<string, number>>;
  bumpVersion: (name: string) => Promise<number>;
  buildKey: (prefix: string, parts?: Record<string, string | number | boolean | null | undefined>) => string;
};

const DEFAULT_PUBLIC_LIST_TTL = 120;
const DEFAULT_PUBLIC_DETAIL_TTL = 600;
const DEFAULT_PUBLIC_LOOKUP_TTL = 60;
const DEFAULT_ADS_SERVE_TTL = 60 * 60 * 24;

const toPositiveInt = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  if (parsed <= 0) return fallback;
  return Math.floor(parsed);
};

export const cacheTtls = {
  publicList: toPositiveInt(process.env.CACHE_TTL_PUBLIC_LIST, DEFAULT_PUBLIC_LIST_TTL),
  publicDetail: toPositiveInt(process.env.CACHE_TTL_PUBLIC_DETAIL, DEFAULT_PUBLIC_DETAIL_TTL),
  publicLookup: toPositiveInt(process.env.CACHE_TTL_PUBLIC_LOOKUP, DEFAULT_PUBLIC_LOOKUP_TTL),
  adsServe: toPositiveInt(process.env.CACHE_TTL_ADS_SERVE, DEFAULT_ADS_SERVE_TTL),
};

export const buildCacheKey = (
  prefix: string,
  parts?: Record<string, string | number | boolean | null | undefined>,
) => {
  if (!parts) return prefix;
  const entries = Object.entries(parts).filter(([, value]) => value !== undefined && value !== null);
  if (entries.length === 0) return prefix;
  entries.sort(([left], [right]) => left.localeCompare(right));
  const suffix = entries
    .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
    .join("&");
  return `${prefix}?${suffix}`;
};

const createNoopCache = (): CacheHelper => ({
  enabled: false,
  getJson: async () => null,
  setJson: async () => undefined,
  getVersion: async () => 1,
  getVersions: async (names) => Object.fromEntries(names.map((name) => [name, 1])),
  bumpVersion: async () => 1,
  buildKey: buildCacheKey,
});

const VERSION_PREFIX = "cache:ver:";

export const cachePlugin = fp(async (app: FastifyInstance) => {
  const redisUrl = process.env.REDIS_URL;
  const cacheEnabled = process.env.CACHE_ENABLED !== "false" && Boolean(redisUrl);

  if (!cacheEnabled) {
    app.decorate("cache", createNoopCache());
    return;
  }

  const client: RedisClientType = createClient({ url: redisUrl });

  client.on("error", (error) => {
    app.log.error({ error }, "Redis client error");
  });

  try {
    await client.connect();
  } catch (error) {
    app.log.warn({ error }, "Redis unavailable; cache disabled");
    app.decorate("cache", createNoopCache());
    return;
  }

  const cache: CacheHelper = {
    enabled: true,
    buildKey: buildCacheKey,
    getJson: async <T>(key: string) => {
      try {
        const raw = await client.get(key);
        if (!raw) return null;
        return JSON.parse(raw) as T;
      } catch (error) {
        app.log.warn({ error }, "Cache get failed");
        return null;
      }
    },
    setJson: async <T>(key: string, value: T, ttlSeconds: number) => {
      try {
        const payload = JSON.stringify(value);
        await client.set(key, payload, { EX: ttlSeconds });
      } catch (error) {
        app.log.warn({ error }, "Cache set failed");
      }
    },
    getVersion: async (name: string) => {
      const versions = await cache.getVersions([name]);
      return versions[name] ?? 1;
    },
    getVersions: async (names: string[]) => {
      try {
        const keys = names.map((name) => `${VERSION_PREFIX}${name}`);
        const values = await client.mGet(keys);
        const result: Record<string, number> = {};
        const missing: string[] = [];

        values.forEach((value, index) => {
          const name = names[index];
          if (value == null) {
            result[name] = 1;
            missing.push(keys[index]);
            return;
          }
          const parsed = Number(value);
          result[name] = Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
        });

        if (missing.length > 0) {
          const multi = client.multi();
          for (const key of missing) {
            multi.set(key, "1", { NX: true });
          }
          await multi.exec();
        }

        return result;
      } catch (error) {
        app.log.warn({ error }, "Cache version lookup failed");
        return Object.fromEntries(names.map((name) => [name, 1]));
      }
    },
    bumpVersion: async (name: string) => {
      const key = `${VERSION_PREFIX}${name}`;
      try {
        const next = await client.incr(key);
        return next;
      } catch (error) {
        app.log.warn({ error }, "Cache version bump failed");
        return 1;
      }
    },
  };

  app.decorate("cache", cache);

  app.addHook("onClose", async () => {
    await client.quit();
  });
});
