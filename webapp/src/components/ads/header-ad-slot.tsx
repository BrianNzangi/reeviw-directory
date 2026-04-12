"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type HeaderAdSlotProps = {
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

type RequestAdResult =
  | { status: "ok"; payload: AdResponse }
  | { status: "empty" | "error" | "cancelled" };

const HEADER_REQUESTS = [
  { slot: "leaderboard", sizeLabel: "728x90" },
  { slot: "billboard", sizeLabel: "970x250" },
] as const;
const ROTATION_MS = 15000;
const FADE_MS = 400;
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

export function HeaderAdSlot({ device = "desktop", className }: HeaderAdSlotProps) {
  const [state, setState] = useState<AdState>({ status: "idle" });
  const [isFading, setIsFading] = useState(false);
  const scriptContainerRef = useRef<HTMLDivElement>(null);
  const impressionSentForRef = useRef<string | null>(null);
  const currentAdIdRef = useRef<string | null>(null);
  const requestIndexRef = useRef(0);

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
    let timer: ReturnType<typeof setInterval> | null = null;
    let fadeTimeout: ReturnType<typeof setTimeout> | null = null;

    async function requestAd(
      requestIndex: number,
      excludeId?: string,
      keepOnEmpty?: boolean,
    ): Promise<RequestAdResult> {
      try {
        const requestConfig = HEADER_REQUESTS[requestIndex];
        const pagePath = typeof window !== "undefined" ? window.location.pathname : "";
        const excludeParam = excludeId ? `&exclude=${encodeURIComponent(excludeId)}` : "";
        const url = `${baseUrl}/api/ads/serve?slot=${encodeURIComponent(requestConfig.slot)}&device=${encodeURIComponent(device)}&size=${encodeURIComponent(requestConfig.sizeLabel)}&page_path=${encodeURIComponent(pagePath)}${excludeParam}`;
        const response = await fetch(url, { cache: "no-store" });
        if (!active) return { status: "cancelled" };
        if (response.status === 204) {
          return { status: "empty" };
        }
        if (!response.ok) {
          return { status: "error" };
        }

        const payload = (await response.json()) as AdResponse;
        if (payload.html) {
          payload.html = fixAdHtml(payload.html);
        }
        if (keepOnEmpty && currentAdIdRef.current && payload.id === currentAdIdRef.current) {
          return { status: "empty" };
        }
        return { status: "ok", payload };
      } catch {
        return { status: "error" };
      }
    }

    async function fetchAd(options?: { showLoading?: boolean; excludeId?: string; keepOnEmpty?: boolean; startIndex?: number }) {
      const showLoading = options?.showLoading ?? false;
      const excludeId = options?.excludeId;
      const keepOnEmpty = options?.keepOnEmpty ?? false;
      const startIndex = options?.startIndex ?? requestIndexRef.current;

      if (showLoading) setState({ status: "loading" });

      for (let offset = 0; offset < HEADER_REQUESTS.length; offset += 1) {
        const index = (startIndex + offset) % HEADER_REQUESTS.length;
        const result = await requestAd(index, excludeId, keepOnEmpty);
        if (!active) return;
        if (result.status === "cancelled") return;
        if (result.status === "ok") {
          requestIndexRef.current = index;
          setState({ status: "ready", ad: result.payload });
          return;
        }
        if (result.status === "error") {
          if (!keepOnEmpty) setState({ status: "error" });
          return;
        }
      }

      if (!keepOnEmpty) setState({ status: "empty" });
    }

    async function rotate() {
      if (!active) return;
      setIsFading(true);
      fadeTimeout = setTimeout(async () => {
        const excludeId = currentAdIdRef.current || undefined;
        const nextIndex = (requestIndexRef.current + 1) % HEADER_REQUESTS.length;
        await fetchAd({ showLoading: false, excludeId, keepOnEmpty: true, startIndex: nextIndex });
        if (active) requestAnimationFrame(() => setIsFading(false));
      }, FADE_MS);
    }

    fetchAd({ showLoading: true, startIndex: requestIndexRef.current });
    timer = setInterval(rotate, ROTATION_MS);

    return () => {
      active = false;
      if (timer) clearInterval(timer);
      if (fadeTimeout) clearTimeout(fadeTimeout);
    };
  }, [baseUrl, device]);

  useEffect(() => {
    if (state.status !== "ready") return;
    currentAdIdRef.current = state.ad.id;
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
        data-ad-slot="header-surface"
        data-ad-device={device}
        data-ad-sizes={HEADER_REQUESTS.map((request) => request.sizeLabel).join(",")}
      >
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Advertisement
        </span>
        <span className="text-xs font-medium text-foreground">
          Leaderboard or billboard placement
        </span>
        <span className="text-[11px] text-muted-foreground">
          Sizes: {HEADER_REQUESTS.map((request) => request.sizeLabel).join(", ")}
        </span>
      </div>
    );
  }

  const { ad } = state;

  return (
    <div
      className={cn(
        "flex w-full items-center justify-center transition-opacity duration-500",
        isFading ? "opacity-0" : "opacity-100",
        className,
      )}
      data-ad-slot="header-surface"
      data-ad-device={device}
      data-ad-sizes={HEADER_REQUESTS.map((request) => request.sizeLabel).join(",")}
    >
      {ad.renderMode === "html" ? (
        <div
          className="w-full max-w-full [&_img]:mx-auto [&_img]:h-auto [&_img]:max-w-full [&_img]:block [&_a]:inline-block [&_a]:w-full [&_a]:text-center"
          style={{ maxWidth: ad.width ? `${ad.width}px` : undefined }}
          dangerouslySetInnerHTML={{ __html: ad.html }}
        />
      ) : (
        <div
          ref={scriptContainerRef}
          className="w-full max-w-full"
          style={{ maxWidth: ad.width ? `${ad.width}px` : undefined }}
        />
      )}
    </div>
  );
}
