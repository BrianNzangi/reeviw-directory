import { and, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { permissions, rolePermissions, roles, users } from "../db/schema.js";

export type UserAccessContext = {
  userId: string;
  email: string;
  roleName: string;
  permissions: string[];
};

export async function findRoleByName(name: string) {
  const [role] = await db.select().from(roles).where(eq(roles.name, name)).limit(1);
  return role;
}

export async function ensureAppUserByAuthIdentity(user: { id: string; email: string }) {
  const email = user.email.toLowerCase();
  const [existing] = await db.select().from(users).where(eq(users.id, user.id)).limit(1);

  if (existing) {
    return existing;
  }

  const fallbackRole = await findRoleByName("customer");
  if (!fallbackRole) {
    throw new Error("Customer role missing. Run db seed.");
  }

  await db.insert(users).values({
    id: user.id,
    email,
    roleId: fallbackRole.id,
    isActive: true,
  }).onConflictDoNothing();

  const [created] = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
  if (!created) {
    throw new Error("Unable to load/create application user");
  }

  return created;
}

export async function setUserRole(userId: string, roleName: string) {
  const role = await findRoleByName(roleName);
  if (!role) {
    throw new Error(`Role ${roleName} not found`);
  }

  await db.update(users).set({ roleId: role.id }).where(eq(users.id, userId));
}

export async function getAccessContext(userId: string): Promise<UserAccessContext | null> {
  const [userRecord] = await db
    .select({
      userId: users.id,
      email: users.email,
      roleName: roles.name,
    })
    .from(users)
    .innerJoin(roles, eq(users.roleId, roles.id))
    .where(eq(users.id, userId))
    .limit(1);

  if (!userRecord) {
    return null;
  }

  const permissionRows = await db
    .select({ permission: permissions.name })
    .from(rolePermissions)
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .innerJoin(roles, eq(rolePermissions.roleId, roles.id))
    .innerJoin(users, and(eq(users.roleId, roles.id), eq(users.id, userId)));

  return {
    userId: userRecord.userId,
    email: userRecord.email,
    roleName: userRecord.roleName,
    permissions: permissionRows.map((row) => row.permission),
  };
}

export function hasPermission(ctx: UserAccessContext, permission: string): boolean {
  return ctx.permissions.includes(permission);
}
