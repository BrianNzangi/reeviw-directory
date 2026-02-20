import "dotenv/config";
import { db, pool } from "./index.js";
import { permissions, rolePermissions, roles } from "./schema.js";

const roleSeed = [
  { name: "superadmin", description: "Full platform access" },
  { name: "content", description: "Content management team" },
  { name: "customer", description: "Authenticated customer" },
] as const;

const permissionSeed = [
  { name: "manage_tools", description: "Create/update tools" },
  { name: "publish_tools", description: "Publish tool records" },
  { name: "manage_categories", description: "Create/update categories" },
  { name: "manage_affiliates", description: "Manage affiliate programs/links" },
  { name: "manage_comparisons", description: "Create/update comparisons" },
  { name: "moderate_reviews", description: "Approve/reject reviews" },
  { name: "submit_review", description: "Submit tool reviews" },
  { name: "manage_posts", description: "Create/update blog posts" },
  { name: "publish_posts", description: "Publish/unpublish blog posts" },
] as const;

async function run() {
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

  const allRoles = await db.select().from(roles);
  const allPermissions = await db.select().from(permissions);

  const roleMap = new Map(allRoles.map((row) => [row.name, row.id]));
  const permissionMap = new Map(allPermissions.map((row) => [row.name, row.id]));

  const contentPermissions = [
    "manage_tools",
    "publish_tools",
    "manage_categories",
    "manage_comparisons",
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
