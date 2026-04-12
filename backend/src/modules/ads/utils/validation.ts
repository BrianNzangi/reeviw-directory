import { getSlotDefinition } from "../constants/slots.js";
import { extractFirstHref, sanitizeSponsoredHtml } from "./html.js";

export function parseSizeLabel(label?: string | null) {
  if (!label) return null;
  const match = label.match(/^(\d+)\s*x\s*(\d+)$/i);
  if (!match) return null;
  const width = Number(match[1]);
  const height = Number(match[2]);
  if (!Number.isFinite(width) || !Number.isFinite(height)) return null;
  return { width, height };
}

export function normalizeDate(value?: string | null) {
  if (value == null) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  const date = new Date(trimmed);
  return Number.isNaN(date.valueOf()) ? null : date;
}

export function normalizeNumber(value: unknown, fallback: number) {
  if (value == null) return fallback;
  const numeric = typeof value === "string" ? Number(value) : (value as number);
  return Number.isFinite(numeric) ? numeric : fallback;
}

export function validateSlotSize(slotSlug: string, _slotDevice: string, width: number, height: number) {
  const definition = getSlotDefinition(slotSlug);
  if (!definition) return false;
  return definition.width === width && definition.height === height;
}

export function normalizeSponsoredConfig(raw: any) {
  const html = typeof raw?.html === "string" ? raw.html.trim() : "";
  const imageUrl = typeof raw?.imageUrl === "string" ? raw.imageUrl.trim() : "";
  const targetUrl = typeof raw?.targetUrl === "string" ? raw.targetUrl.trim() : "";
  const appendClickref = raw?.appendClickref !== false;

  if (!html && !(imageUrl && targetUrl)) {
    return { error: "Sponsored ads require HTML or image + target URL." };
  }

  let sanitizedHtml = html ? sanitizeSponsoredHtml(html) : "";
  if (html && !sanitizedHtml) {
    return { error: "Sponsored HTML contains disallowed markup." };
  }
  if (sanitizedHtml) {
    const href = extractFirstHref(sanitizedHtml);
    if (!href) {
      return { error: "Sponsored HTML must include a link (href)." };
    }
  }

  return {
    value: {
      html: sanitizedHtml || null,
      imageUrl: imageUrl || null,
      targetUrl: targetUrl || null,
      appendClickref,
    },
  };
}

export function normalizeScriptConfig(raw: any, provider: string) {
  const script = typeof raw?.script === "string" ? raw.script.trim() : "";
  if (!script) {
    return { error: `${provider === "google_ads" ? "Google Ads" : "Mediavine"} scripts are required.` };
  }
  return { value: { script } };
}

export function normalizeConfig(provider: string, raw: any) {
  if (provider === "sponsored") return normalizeSponsoredConfig(raw);
  if (provider === "google_ads" || provider === "mediavine") return normalizeScriptConfig(raw, provider);
  return { error: "Unsupported provider." };
}

export function resolveSponsoredTarget(config: any) {
  const targetUrl = typeof config?.targetUrl === "string" ? config.targetUrl.trim() : "";
  if (targetUrl) return targetUrl;
  const html = typeof config?.html === "string" ? config.html : "";
  return html ? extractFirstHref(html) : null;
}
