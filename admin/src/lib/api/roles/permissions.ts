import { api } from "@/lib/api/client";
import type { Permission, RolePermission } from "./types";

export async function listPermissions() {
  return api.get<Permission[]>("/api/permissions");
}

export async function listRolePermissions() {
  return api.get<RolePermission[]>("/api/role-permissions");
}

export async function updateRolePermissions(roleId: string, permissionIds: string[]) {
  return api.patch<{ ok: boolean }>(`/api/roles/${roleId}/permissions`, { permissionIds });
}
