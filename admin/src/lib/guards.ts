import { redirect } from "next/navigation";
import { requireMe } from "./me";
import { hasPermission, isSuperadmin } from "./permissions";

export async function requirePermission(permission: string) {
  const me = await requireMe();
  if (!hasPermission(me.permissions, permission) && !isSuperadmin(me.role)) {
    redirect("/forbidden");
  }
  return me;
}

export async function requireAnyPermission(permissions: string[]) {
  const me = await requireMe();
  const allowed = permissions.some((permission) => hasPermission(me.permissions, permission)) || isSuperadmin(me.role);
  if (!allowed) {
    redirect("/forbidden");
  }
  return me;
}
