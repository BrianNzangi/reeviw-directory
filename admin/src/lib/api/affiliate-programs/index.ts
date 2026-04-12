import { api } from "@/lib/api/client";
import type { AffiliateProgram } from "./types";

export async function listAffiliatePrograms() {
  return api.get<AffiliateProgram[]>("/api/admin/affiliate-programs");
}

export async function getAffiliateProgram(id: string) {
  return api.get<AffiliateProgram>(`/api/admin/affiliate-programs/${id}`);
}

export async function createAffiliateProgram(body: Record<string, unknown>) {
  return api.post<AffiliateProgram>("/api/admin/affiliate-programs", body);
}

export async function updateAffiliateProgram(id: string, body: Record<string, unknown>) {
  return api.patch<AffiliateProgram>(`/api/admin/affiliate-programs/${id}`, body);
}

export async function syncAffiliateProgram(id: string) {
  return api.post<{ ok: boolean; result?: any }>(`/api/admin/affiliate-programs/${id}/sync`);
}

export async function testAffiliateProgramFeed(id: string) {
  return api.post<{ ok: boolean; status: number; bytes: number }>(
    `/api/admin/affiliate-programs/${id}/test-feed`,
  );
}

export * from "./types";
