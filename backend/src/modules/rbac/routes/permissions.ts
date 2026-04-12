import type { FastifyInstance } from "fastify";
import { eq, inArray } from "drizzle-orm";
import { db } from "../../../db/index.js";
import { permissions, rolePermissions, roles } from "../../../db/schema.js";
import { requireAnyPermission } from "../../../middleware/requireAnyPermission.js";
import { requireAuth } from "../../../middleware/requireAuth.js";
import { requirePermission } from "../../../middleware/requirePermission.js";
import { errorResponseSchema, permissionSchema } from "../schemas/rbacSchemas.js";

export async function registerPermissionAdminRoutes(app: FastifyInstance) {
  app.get("/api/permissions", {
    preHandler: [requireAuth, requireAnyPermission(["manage_permissions", "manage_roles", "manage_users"])],
    schema: {
      description: "List permissions (admin)",
      response: {
        200: { type: "array", items: permissionSchema },
      },
    },
    handler: async () => {
      return db.select().from(permissions);
    },
  });

  app.get("/api/role-permissions", {
    preHandler: [requireAuth, requireAnyPermission(["manage_permissions", "manage_roles", "manage_users"])],
    schema: {
      description: "List role to permission assignments (admin)",
      response: {
        200: {
          type: "array",
          items: {
            type: "object",
            properties: {
              role: { type: "string" },
              permission: { type: "string" },
            },
            required: ["role", "permission"],
          },
        },
      },
    },
    handler: async () => {
      const rows = await db
        .select({ role: roles.name, permission: permissions.name })
        .from(rolePermissions)
        .innerJoin(roles, eq(rolePermissions.roleId, roles.id))
        .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id));
      return rows;
    },
  });

  app.patch("/api/roles/:id/permissions", {
    preHandler: [requireAuth, requirePermission("manage_permissions")],
    schema: {
      description: "Replace permissions for a role (admin)",
      params: {
        type: "object",
        properties: { id: { type: "string" } },
        required: ["id"],
      },
      body: {
        type: "object",
        properties: {
          permissionIds: { type: "array", items: { type: "string" } },
        },
        required: ["permissionIds"],
      },
      response: {
        200: {
          type: "object",
          properties: { ok: { type: "boolean" } },
          required: ["ok"],
        },
        400: errorResponseSchema,
        404: errorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const params = request.params as { id: string };
      const body = request.body as { permissionIds?: string[] };

      if (!Array.isArray(body?.permissionIds)) {
        return reply.code(400).send({ error: "permissionIds is required" });
      }

      const [role] = await db.select().from(roles).where(eq(roles.id, params.id)).limit(1);
      if (!role) {
        return reply.code(404).send({ error: "Role not found" });
      }

      if (body.permissionIds.length) {
        const valid = await db
          .select({ id: permissions.id })
          .from(permissions)
          .where(inArray(permissions.id, body.permissionIds));
        if (valid.length !== body.permissionIds.length) {
          return reply.code(400).send({ error: "One or more permissions are invalid" });
        }
      }

      await db.delete(rolePermissions).where(eq(rolePermissions.roleId, params.id));

      if (body.permissionIds.length) {
        await db
          .insert(rolePermissions)
          .values(body.permissionIds.map((permissionId) => ({ roleId: params.id, permissionId })))
          .onConflictDoNothing();
      }

      return { ok: true };
    },
  });
}

