export function sanitizeSponsoredHtml(html: string) {
  let cleaned = html.trim();
  if (!cleaned) return "";
  cleaned = cleaned.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");
  cleaned = cleaned.replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, "");
  cleaned = cleaned.replace(/\son\w+=(".*?"|'.*?'|[^\s>]+)/gi, "");
  cleaned = cleaned.replace(/javascript:/gi, "");
  return cleaned;
}

export function extractFirstHref(html: string) {
  const match = html.match(/<a\b[^>]*href=["']([^"']+)["']/i);
  return match?.[1] || null;
}

function ensureRelSponsored(tag: string) {
  if (/\srel=/.test(tag)) {
    return tag.replace(/rel=(["'])(.*?)\1/i, (_match, quote, value) => {
      const parts = value.split(/\s+/).filter(Boolean);
      if (!parts.includes("sponsored")) parts.push("sponsored");
      return `rel=${quote}${parts.join(" ")}${quote}`;
    });
  }
  return tag.replace(/<a\b/i, '<a rel="sponsored"');
}

function updateFirstAnchor(html: string, updater: (tag: string) => string) {
  return html.replace(/<a\b[^>]*>/i, (match) => updater(match));
}

export function injectClickUrl(html: string, clickUrl: string) {
  if (!html) return html;
  let updated = html;
  if (updated.includes("{{CLICK_URL}}")) {
    updated = updated.replace(/\{\{\s*CLICK_URL\s*\}\}/g, clickUrl);
  }
  if (/<a\b/i.test(updated)) {
    updated = updateFirstAnchor(updated, (tag) => {
      let next = tag.replace(/href=(["'])(.*?)\1/i, (_match, quote) => `href=${quote}${clickUrl}${quote}`);
      if (!/href=/.test(next)) {
        next = next.replace(/<a\b/i, `<a href="${clickUrl}"`);
      }
      return ensureRelSponsored(next);
    });
    return updated;
  }
  return `<a href="${clickUrl}" rel="sponsored">${updated}</a>`;
}
