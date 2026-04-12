import { api } from "@/lib/api/client";
import { buildQuery } from "@/lib/utils/buildQuery";
import type { AdAnalytics } from "./types";

export async function getAdAnalytics(params?: { days?: number; provider?: string; slot?: string }) {
  const query = buildQuery({
    days: params?.days,
    provider: params?.provider,
    slot: params?.slot,
  });
  const queryString = query.toString();
  return api.get<AdAnalytics>(`/api/admin/ad-analytics${queryString ? `?${queryString}` : ""}`);
}
