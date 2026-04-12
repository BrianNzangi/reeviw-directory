import { api } from "@/lib/api/client";
import type { MerchantAnalytics } from "./types";

export async function getMerchantAnalytics(days?: number) {
  const query = days ? `?days=${days}` : "";
  return api.get<MerchantAnalytics>(`/api/merchants/analytics${query}`);
}
