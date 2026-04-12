export function simpleHash(value: string) {
  let hash = 5381;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 33) ^ value.charCodeAt(i);
  }
  return (hash >>> 0).toString(36);
}

export function normalizePagePath(pagePath?: string | null) {
  if (!pagePath) return "";
  const trimmed = pagePath.trim();
  if (!trimmed) return "";
  return trimmed.split("?")[0]?.split("#")[0] || "";
}

export function buildClickref(slotSlug: string, adId: string, pagePath?: string | null) {
  const normalized = normalizePagePath(pagePath);
  let pageTag = "unknown";
  if (!normalized || normalized === "/") {
    pageTag = "homepage";
  } else {
    const cleaned = normalized.replace(/^\/+/, "").replace(/\/+$/, "");
    pageTag = cleaned ? cleaned.replace(/\//g, "-") : "homepage";
    if (pageTag.length > 32) {
      pageTag = simpleHash(cleaned);
    }
  }
  return `${slotSlug}:${adId}:${pageTag}`;
}

export function appendClickref(url: string, clickref: string) {
  const [base, hash] = url.split("#");
  try {
    const parsed = new URL(base);
    parsed.searchParams.set("clickref", clickref);
    const next = parsed.toString();
    return hash ? `${next}#${hash}` : next;
  } catch {
    const separator = base.includes("?") ? "&" : "?";
    const next = `${base}${separator}clickref=${encodeURIComponent(clickref)}`;
    return hash ? `${next}#${hash}` : next;
  }
}
