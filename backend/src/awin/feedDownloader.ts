import { createWriteStream, promises as fs } from "fs";
import { Readable, Transform } from "stream";
import { pipeline } from "stream/promises";
import { tmpdir } from "os";
import { join } from "path";
import { randomUUID } from "crypto";

type DownloadOptions = {
  timeoutMs?: number;
  maxAttempts429?: number;
  maxAttempts5xx?: number;
  ifNoneMatch?: string | null;
  ifModifiedSince?: string | null;
  maxBytes?: number;
};

type DownloadResult = {
  filePath: string | null;
  etag?: string | null;
  lastModified?: string | null;
  status: number;
  notModified: boolean;
  bytes: number;
  contentType?: string | null;
};

const DEFAULT_TIMEOUT_MS = 120_000;
const DEFAULT_MAX_429 = 5;
const DEFAULT_MAX_5XX = 3;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function backoffDelay(attempt: number) {
  const base = 500;
  const jitter = Math.floor(Math.random() * 200);
  return base * Math.pow(2, attempt - 1) + jitter;
}

async function fetchWithRetry(url: string, options: RequestInit, config: DownloadOptions) {
  const max429 = config.maxAttempts429 ?? DEFAULT_MAX_429;
  const max5xx = config.maxAttempts5xx ?? DEFAULT_MAX_5XX;
  const totalAttempts = Math.max(max429, max5xx);

  for (let attempt = 1; attempt <= totalAttempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.timeoutMs ?? DEFAULT_TIMEOUT_MS);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeout);

      const status = response.status;
      if (status === 429 && attempt < max429) {
        await response.body?.cancel();
        const retryAfter = response.headers.get("retry-after");
        const retryMs = retryAfter ? Number(retryAfter) * 1000 : backoffDelay(attempt);
        await sleep(Number.isFinite(retryMs) ? retryMs : backoffDelay(attempt));
        continue;
      }
      if (status >= 500 && status < 600 && attempt < max5xx) {
        await response.body?.cancel();
        await sleep(backoffDelay(attempt));
        continue;
      }
      return response;
    } catch (error) {
      clearTimeout(timeout);
      if (attempt >= totalAttempts) throw error;
      await sleep(backoffDelay(attempt));
    }
  }

  throw new Error("Failed to download feed after retries.");
}

export async function downloadFeed(feedUrl: string, options: DownloadOptions = {}): Promise<DownloadResult> {
  const headers: Record<string, string> = {
    "user-agent": "BargainlyDeals-AWIN/1.0",
    accept: "*/*",
  };
  if (options.ifNoneMatch) headers["if-none-match"] = options.ifNoneMatch;
  if (options.ifModifiedSince) headers["if-modified-since"] = options.ifModifiedSince;

  const response = await fetchWithRetry(feedUrl, { method: "GET", headers, redirect: "follow" }, options);
  if (response.status === 304) {
    return {
      filePath: null,
      status: response.status,
      notModified: true,
      bytes: 0,
      etag: response.headers.get("etag"),
      lastModified: response.headers.get("last-modified"),
      contentType: response.headers.get("content-type"),
    };
  }
  if (!response.ok || !response.body) {
    throw new Error(`Feed download failed with status ${response.status}.`);
  }

  const target = join(tmpdir(), `awin-feed-${randomUUID()}`);
  let bytes = 0;
  const readable = Readable.fromWeb(response.body as any);
  const transform = new Transform({
    transform(chunk, _encoding, callback) {
      bytes += chunk.length ?? 0;
      if (options.maxBytes && bytes > options.maxBytes) {
        callback(new Error("Feed download exceeded size limit."));
        return;
      }
      callback(null, chunk);
    },
  });

  try {
    await pipeline(readable, transform, createWriteStream(target));
  } catch (error) {
    await fs.unlink(target).catch(() => null);
    throw error;
  }

  return {
    filePath: target,
    status: response.status,
    notModified: false,
    bytes,
    etag: response.headers.get("etag"),
    lastModified: response.headers.get("last-modified"),
    contentType: response.headers.get("content-type"),
  };
}
