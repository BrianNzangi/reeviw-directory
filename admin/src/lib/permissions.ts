export type AdminMe = {
  user: { id: string; email: string } | null;
  role: string | null;
  permissions: string[];
};

export function hasPermission(permissions: string[] | undefined, permission: string) {
  return (permissions || []).includes(permission);
}

export function isSuperadmin(role: string | null | undefined) {
  return role === "superadmin";
}

export function canAccessUserAdmin(me: AdminMe | null) {
  if (!me) return false;
  if (isSuperadmin(me.role)) return true;
  const perms = me.permissions;
  return (
    hasPermission(perms, "manage_users") ||
    hasPermission(perms, "manage_roles") ||
    hasPermission(perms, "manage_permissions")
  );
}
