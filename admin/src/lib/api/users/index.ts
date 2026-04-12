import { api } from "@/lib/api/client";
import type { User } from "./types";

export async function listUsers() {
  return api.get<User[]>("/api/users");
}

export async function updateUserRole(userId: string, roleId: string) {
  return api.patch(`/api/users/${userId}/role`, { roleId });
}

export * from "./types";
