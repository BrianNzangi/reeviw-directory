"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type AdResponse = {
  id: string;
  provider: "sponsored" | "google_ads" | "mediavine";
  slot: { slug: string; device: string };
  width: number;
  height: number;
  renderMode: "html" | "raw_script" | "container_script";
  html?: string;
  clickref?: string;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3002";

export function AdSlot({
  slot,
  device,
  className,
}: {
  slot: string;
  device: "desktop" | "mobile";
  className?: string;
}) {
  const [ad, setAd] = useState<AdResponse | null>(null);
  const [pagePath, setPagePath] = useState<string>("");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const trackedRef = useRef(false);

  useEffect(() => {
    setPagePath(window.location.pathname || "/");
  }, []);

  useEffect(() => {
    if (!slot || !device || !pagePath) return;
    const controller = new AbortController();
    fetch(
      `${API_BASE_URL}/api/ads/serve?slot=${encodeURIComponent(slot)}&device=${encodeURIComponent(
        device,
      )}&page_path=${encodeURIComponent(pagePath)}`,
      { signal: controller.signal },
    )
      .then(async (response) => {
        if (response.status === 204) return null;
        if (!response.ok) {
          throw new Error("Failed to load ad");
        }
        return response.json() as Promise<AdResponse>;
      })
      .then((data) => {
        trackedRef.current = false;
        setAd(data);
      })
      .catch(() => setAd(null));

    return () => controller.abort();
  }, [slot, device, pagePath]);

  useEffect(() => {
    if (!ad || ad.provider !== "sponsored") return;
    if (!containerRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting || trackedRef.current) return;
        trackedRef.current = true;
        fetch(`${API_BASE_URL}/api/ads/impression`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ adId: ad.id, pagePath, clickref: ad.clickref }),
        }).catch(() => null);
      },
      { threshold: 0.5 },
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [ad, pagePath]);

  useEffect(() => {
    if (!ad || ad.provider !== "google_ads") return;
    const win = window as Window & { adsbygoogle?: Array<Record<string, unknown>> };
    win.adsbygoogle = win.adsbygoogle || [];
    try {
      win.adsbygoogle.push({});
    } catch {
      // Ignore script errors; Google Ads script may not be loaded yet.
    }
  }, [ad]);

  if (!ad) return null;

  const style = {
    width: "100%",
    maxWidth: ad.width ? `${ad.width}px` : undefined,
    minHeight: ad.height ? `${ad.height}px` : undefined,
  };

  return (
    <div ref={containerRef} className={cn("flex items-center justify-center", className)} style={style}>
      <div dangerouslySetInnerHTML={{ __html: ad.html || "" }} />
    </div>
  );
}
