import { api } from "@/lib/api/client";
import type { Offer } from "./types";

export async function createProductOffer(productId: string, body: Record<string, unknown>) {
  return api.post<Offer>(`/api/products/${productId}/offers`, body);
}

export async function updateOffer(id: string, body: Record<string, unknown>) {
  return api.patch<Offer>(`/api/offers/${id}`, body);
}

export async function deleteOffer(id: string) {
  return api.delete<{ ok: boolean }>(`/api/offers/${id}`);
}
