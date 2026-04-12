"use client";

import { usePathname } from "next/navigation";
import { HeaderAdSlot } from "@/components/ads/header-ad-slot";
import { Container } from "@/components/container";

const AD_FREE_PATHS = new Set([
  "/login",
  "/about-bargainly-deals",
  "/about-our-ads",
  "/faq",
  "/support",
  "/privacy",
  "/terms",
  "/advertise",
]);

export function HeaderAdSurface() {
  const pathname = usePathname();
  if (pathname && AD_FREE_PATHS.has(pathname)) return null;

  return (
    <div className="border-t border-border bg-background">
      <Container className="py-4 flex justify-center">
        <HeaderAdSlot className="w-full max-w-242.5" />
      </Container>
    </div>
  );
}


