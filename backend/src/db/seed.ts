import "dotenv/config";
import { db, pool } from "./index.js";
import { and, eq } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";
import { permissions, rolePermissions, roles, users, authUser, authAccount } from "./schema.js";

const roleSeed = [
  { name: "superadmin", description: "Full platform access" },
  { name: "content", description: "Content management team" },
  { name: "customer", description: "Authenticated customer" },
] as const;

const permissionSeed = [
  { name: "manage_products", description: "Create/update products" },
  { name: "publish_products", description: "Publish product records" },
  { name: "manage_categories", description: "Create/update categories" },
  { name: "manage_affiliates", description: "Manage affiliate programs/links" },
  { name: "manage_jobs", description: "Run background jobs" },
  { name: "moderate_reviews", description: "Approve/reject reviews" },
  { name: "submit_review", description: "Submit product reviews" },
  { name: "manage_posts", description: "Create/update blog posts" },
  { name: "publish_posts", description: "Publish/unpublish blog posts" },
  { name: "manage_ads", description: "Manage advertising inventory" },
  { name: "manage_users", description: "Manage users and assignments" },
  { name: "manage_roles", description: "Create/update roles" },
  { name: "manage_permissions", description: "Assign permissions to roles" },
] as const;

async function run() {
  const superadminEmail =
    (process.env.SUPERADMIN_EMAILS || "admin@bargainlydeals.com")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .find(Boolean) || "admin@bargainlydeals.com";
  const superadminBootstrapPassword = process.env.SUPERADMIN_BOOTSTRAP_PASSWORD || "";

  for (const role of roleSeed) {
    await db
      .insert(roles)
      .values(role)
      .onConflictDoUpdate({
        target: roles.name,
        set: { description: role.description },
      });
  }

  for (const permission of permissionSeed) {
    await db
      .insert(permissions)
      .values(permission)
      .onConflictDoUpdate({
        target: permissions.name,
        set: { description: permission.description },
      });
  }

  // Create super admin user
  const superadminRole = await db.select().from(roles).where(eq(roles.name, "superadmin")).limit(1);
  if (superadminRole.length > 0) {
    const superadminRoleId = superadminRole[0].id;

    const existingAppUser = await db.select().from(users).where(eq(users.email, superadminEmail)).limit(1);
    const existingAuthUser = await db.select().from(authUser).where(eq(authUser.email, superadminEmail)).limit(1);

    const canonicalUserId = existingAppUser[0]?.id || existingAuthUser[0]?.id || crypto.randomUUID();

    if (existingAppUser.length === 0) {
      await db.insert(users).values({
        id: canonicalUserId,
        email: superadminEmail,
        roleId: superadminRoleId,
        isActive: true,
      });
    } else {
      await db
        .update(users)
        .set({
          roleId: superadminRoleId,
          isActive: true,
          updatedAt: new Date(),
        })
        .where(eq(users.id, existingAppUser[0].id));
    }

    if (existingAuthUser.length === 0) {
      await db.insert(authUser).values({
        id: canonicalUserId,
        email: superadminEmail,
        emailVerified: true,
      });
    } else if (existingAuthUser[0].id !== canonicalUserId) {
      // Keep Better Auth and app user IDs aligned; deleting by email cascades stale sessions/accounts.
      await db.delete(authUser).where(eq(authUser.email, superadminEmail));
      await db.insert(authUser).values({
        id: canonicalUserId,
        email: superadminEmail,
        emailVerified: true,
      });
    }

    const existingCredentialAccount = await db
      .select()
      .from(authAccount)
      .where(and(eq(authAccount.userId, canonicalUserId), eq(authAccount.providerId, "credential")))
      .limit(1);

    if (existingCredentialAccount.length === 0) {
      const passwordHash = await hashPassword(superadminBootstrapPassword);
      await db.insert(authAccount).values({
        id: crypto.randomUUID(),
        accountId: canonicalUserId,
        providerId: "credential",
        userId: canonicalUserId,
        password: passwordHash,
      });
      console.log(`Super admin credential account created: ${superadminEmail}`);
    } else if (!existingCredentialAccount[0].password?.includes(":")) {
      // Repair legacy placeholder/non-scrypt password values.
      const passwordHash = await hashPassword(superadminBootstrapPassword);
      await db
        .update(authAccount)
        .set({ password: passwordHash, updatedAt: new Date() })
        .where(eq(authAccount.id, existingCredentialAccount[0].id));
      console.log(`Super admin credential account repaired: ${superadminEmail}`);
    } else {
      console.log(`Super admin credential account already exists: ${superadminEmail}`);
    }
  }

  const allRoles = await db.select().from(roles);
  const allPermissions = await db.select().from(permissions);

  const roleMap = new Map(allRoles.map((row) => [row.name, row.id]));
  const permissionMap = new Map(allPermissions.map((row) => [row.name, row.id]));

  const contentPermissions = [
    "manage_products",
    "publish_products",
    "manage_categories",
    "moderate_reviews",
    "manage_posts",
    "publish_posts",
  ] as const;

  const customerPermissions = ["submit_review"] as const;

  const mappings: Array<{ role: string; permission: string }> = [];

  for (const permission of permissionSeed) {
    mappings.push({ role: "superadmin", permission: permission.name });
  }

  for (const permission of contentPermissions) {
    mappings.push({ role: "content", permission });
  }

  for (const permission of customerPermissions) {
    mappings.push({ role: "customer", permission });
  }

  for (const mapping of mappings) {
    const roleId = roleMap.get(mapping.role);
    const permissionId = permissionMap.get(mapping.permission);

    if (!roleId || !permissionId) {
      continue;
    }

    await db
      .insert(rolePermissions)
      .values({ roleId, permissionId })
      .onConflictDoNothing();
  }

  await pool.end();
}

run().catch(async (error) => {
  console.error("Seed failed", error);
  await pool.end();
  process.exit(1);
});
