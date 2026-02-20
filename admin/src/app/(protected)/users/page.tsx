import { requireAnyPermission } from "@/lib/guards";
import { UsersClient } from "./users-client";

export default async function UsersPage() {
  await requireAnyPermission(["manage_users", "manage_roles", "manage_permissions"]);
  return <UsersClient />;
}
