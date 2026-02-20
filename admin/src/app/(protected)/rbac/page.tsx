import { requireAnyPermission } from "@/lib/guards";
import { RbacClient } from "./rbac-client";

export default async function RbacPage() {
  await requireAnyPermission(["manage_users", "manage_roles", "manage_permissions"]);
  return <RbacClient />;
}
