"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Horizontal2AdSlotProps = {
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

const SLOT_SLUG = "billboard";
const SIZE_LABEL = "970x250";
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

export function Horizontal2AdSlot({ device = "desktop", className }: Horizontal2AdSlotProps) {
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

    async function fetchAd() {
      setState({ status: "loading" });
      try {
        const pagePath = typeof window !== "undefined" ? window.location.pathname : "";
        const url = `${baseUrl}/api/ads/serve?slot=${encodeURIComponent(SLOT_SLUG)}&device=${encodeURIComponent(device)}&size=${encodeURIComponent(SIZE_LABEL)}&page_path=${encodeURIComponent(pagePath)}`;
        const response = await fetch(url, { cache: "no-store" });
        if (!active) return;

        if (response.status === 204) {
          setState({ status: "empty" });
          return;
        }
        if (!response.ok) {
          setState({ status: "error" });
          return;
        }

        const payload = (await response.json()) as AdResponse;
        if (payload.html) {
          payload.html = fixAdHtml(payload.html);
        }
        setState({ status: "ready", ad: payload });
      } catch {
        if (active) setState({ status: "error" });
      }
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
        data-ad-size={SIZE_LABEL}
      >
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Advertisement
        </span>
        <span className="text-xs font-medium text-foreground">
          Billboard placement
        </span>
        <span className="text-[11px] text-muted-foreground">
          Size: {SIZE_LABEL}
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
      data-ad-size={SIZE_LABEL}
    >
      {ad.renderMode === "html" ? (
        <div
          className="w-full max-w-full [&_img]:mx-auto [&_img]:h-auto [&_img]:max-w-full [&_img]:block [&_a]:inline-block [&_a]:w-full [&_a]:text-center"
          style={{ maxWidth: ad.width ? `${ad.width}px` : "970px" }}
          dangerouslySetInnerHTML={{ __html: ad.html }}
        />
      ) : (
        <div
          ref={scriptContainerRef}
          className="w-full max-w-full"
          style={{ maxWidth: ad.width ? `${ad.width}px` : "970px" }}
        />
      )}
    </div>
  );
}
