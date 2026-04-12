import { api } from "@/lib/api/client";
import { buildQuery } from "@/lib/utils/buildQuery";
import type { AdCampaign } from "./types";

export async function listAdCampaigns(params?: { slotId?: string; provider?: string; active?: boolean }) {
  const query = buildQuery({
    slotId: params?.slotId,
    provider: params?.provider,
    active: params?.active === undefined ? undefined : params.active ? "true" : "false",
  });
  const queryString = query.toString();
  return api.get<AdCampaign[]>(`/api/admin/ad-campaigns${queryString ? `?${queryString}` : ""}`);
}

export async function getAdCampaign(id: string) {
  return api.get<AdCampaign>(`/api/admin/ad-campaigns/${id}`);
}

export async function createAdCampaign(body: Record<string, unknown>) {
  return api.post<AdCampaign>("/api/admin/ad-campaigns", body);
}

export async function updateAdCampaign(id: string, body: Record<string, unknown>) {
  return api.patch<AdCampaign>(`/api/admin/ad-campaigns/${id}`, body);
}
