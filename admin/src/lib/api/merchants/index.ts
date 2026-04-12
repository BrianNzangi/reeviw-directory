import { api } from "@/lib/api/client";
import type { Merchant } from "./types";

export async function listMerchants() {
  return api.get<Merchant[]>("/api/merchants");
}

export async function createMerchant(body: Record<string, unknown>) {
  return api.post<Merchant>("/api/merchants", body);
}

export async function updateMerchant(id: string, body: Record<string, unknown>) {
  return api.patch<Merchant>(`/api/merchants/${id}`, body);
}

export async function deleteMerchant(id: string) {
  return api.delete<{ ok: boolean }>(`/api/merchants/${id}`);
}

export * from "./types";
export * from "./analytics";
