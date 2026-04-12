import { api } from "@/lib/api/client";
import type { Role } from "./types";

export async function listRoles() {
  return api.get<Role[]>("/api/roles");
}

export async function createRole(body: { name: string; description?: string }) {
  return api.post<Role>("/api/roles", body);
}

export async function updateRole(id: string, body: Partial<{ name: string; description?: string }>) {
  return api.patch<Role>(`/api/roles/${id}`, body);
}

export async function deleteRole(id: string) {
  return api.delete<{ ok: boolean }>(`/api/roles/${id}`);
}

export * from "./types";
export * from "./permissions";
