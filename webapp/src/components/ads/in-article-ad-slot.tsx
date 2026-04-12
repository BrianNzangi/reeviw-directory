"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type InArticleAdSlotProps = {
  device?: "desktop";
  className?: string;
};

type AdResponse = {
  id: string;
  provider: "sponsored" | "google_ads" | "mediavine" | string;
  slot: { slug: string; device: string };
  width: number;
  height: number;
  renderMode: "html" | "raw_script" | "container_script" | string;
  html: string;
  clickref?: string;
};

type AdState =
  | { status: "idle" | "loading" | "empty" | "error" }
  | { status: "ready"; ad: AdResponse };

const SLOT_SLUG = "rectangle";
const SIZE_LABELS = ["300x250"] as const;
const ADS_PATH_PREFIX = "/api/ads/";

function execScripts(container: HTMLElement) {
  const scripts = Array.from(container.querySelectorAll("script"));
  scripts.forEach((script) => {
    const replacement = document.createElement("script");
    for (const attr of Array.from(script.attributes)) {
      replacement.setAttribute(attr.name, attr.value);
    }
    replacement.text = script.textContent || "";
    script.parentNode?.replaceChild(replacement, script);
  });
}

export function InArticleAdSlot({ device = "desktop", className }: InArticleAdSlotProps) {
  const [state, setState] = useState<AdState>({ status: "idle" });
  const scriptContainerRef = useRef<HTMLDivElement>(null);
  const impressionSentForRef = useRef<string | null>(null);

  const baseUrl = useMemo(
    () =>
      process.env.NEXT_PUBLIC_API_BASE_URL
      || process.env.NEXT_PUBLIC_BACKEND_URL
      || "http://localhost:3002",
    [],
  );
  const normalizedBaseUrl = baseUrl.replace(/\/$/, "");

  function fixAdHtml(html: string) {
    return html.replace(/((?:href|src)\s*=\s*["'])\/api\/ads\//g, `$1${normalizedBaseUrl}${ADS_PATH_PREFIX}`);
  }

  useEffect(() => {
    let active = true;

    async function fetchBySize(sizeLabel: string) {
      try {
        const pagePath = typeof window !== "undefined" ? window.location.pathname : "";
        const url = `${baseUrl}/api/ads/serve?slot=${encodeURIComponent(SLOT_SLUG)}&device=${encodeURIComponent(device)}&size=${encodeURIComponent(sizeLabel)}&page_path=${encodeURIComponent(pagePath)}`;
        const response = await fetch(url, { cache: "no-store" });
        if (!active) return null;
        if (response.status === 204 || !response.ok) return null;

        const payload = (await response.json()) as AdResponse;
        if (payload.html) {
          payload.html = fixAdHtml(payload.html);
        }
        return payload;
      } catch {
        return null;
      }
    }

    async function fetchAd() {
      setState({ status: "loading" });
      for (const sizeLabel of SIZE_LABELS) {
        const ad = await fetchBySize(sizeLabel);
        if (!active) return;
        if (ad) {
          setState({ status: "ready", ad });
          return;
        }
      }

      if (active) setState({ status: "empty" });
    }

    fetchAd();
    return () => {
      active = false;
    };
  }, [baseUrl, device]);

  useEffect(() => {
    if (state.status !== "ready") return;
    if (state.ad.renderMode === "html") return;
    if (!state.ad.html) return;
    const container = scriptContainerRef.current;
    if (!container) return;
    container.innerHTML = state.ad.html;
    execScripts(container);
  }, [state]);

  useEffect(() => {
    if (state.status !== "ready") return;
    if (impressionSentForRef.current === state.ad.id) return;
    impressionSentForRef.current = state.ad.id;

    const pagePath = typeof window !== "undefined" ? window.location.pathname : "";
    fetch(`${baseUrl}/api/ads/impression`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adId: state.ad.id,
        pagePath,
        clickref: state.ad.clickref,
      }),
    }).catch(() => null);
  }, [baseUrl, state]);

  if (state.status !== "ready") {
    return (
      <div
        className={cn(
          "flex w-full flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border bg-muted/40 px-4 py-6 text-center",
          className,
        )}
        data-ad-slot={SLOT_SLUG}
        data-ad-device={device}
        data-ad-sizes={SIZE_LABELS.join(",")}
      >
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Advertisement
        </span>
        <span className="text-xs font-medium text-foreground">
          Rectangle placement
        </span>
        <span className="text-[11px] text-muted-foreground">
          Sizes: {SIZE_LABELS.join(", ")}
        </span>
      </div>
    );
  }

  const { ad } = state;

  return (
    <div
      className={cn("flex w-full items-center justify-center", className)}
      data-ad-slot={SLOT_SLUG}
      data-ad-device={device}
      data-ad-sizes={SIZE_LABELS.join(",")}
    >
      {ad.renderMode === "html" ? (
        <div
          className="w-full max-w-full [&_img]:mx-auto [&_img]:h-auto [&_img]:max-w-full [&_img]:block [&_a]:inline-block [&_a]:w-full [&_a]:text-center"
          style={{ maxWidth: ad.width ? `${ad.width}px` : "300px" }}
          dangerouslySetInnerHTML={{ __html: ad.html }}
        />
      ) : (
        <div
          ref={scriptContainerRef}
          className="w-full max-w-full"
          style={{ maxWidth: ad.width ? `${ad.width}px` : "300px" }}
        />
      )}
    </div>
  );
}
