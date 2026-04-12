import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import { db } from "../../../db/index.js";
import { roles, users } from "../../../db/schema.js";
import { requireAnyPermission } from "../../../middleware/requireAnyPermission.js";
import { requireAuth } from "../../../middleware/requireAuth.js";
import { requirePermission } from "../../../middleware/requirePermission.js";
import { errorResponseSchema, userSchema, userSummarySchema } from "../schemas/rbacSchemas.js";

export async function registerUserAdminRoutes(app: FastifyInstance) {
  app.get("/api/users", {
    preHandler: [requireAuth, requireAnyPermission(["manage_users", "manage_roles", "manage_permissions"])],
    schema: {
      description: "List users with roles (admin)",
      response: {
        200: { type: "array", items: userSummarySchema },
      },
    },
    handler: async () => {
      return db.select({ id: users.id, email: users.email, roleId: users.roleId }).from(users);
    },
  });

  app.patch("/api/users/:userId/role", {
    preHandler: [requireAuth, requirePermission("manage_users")],
    schema: {
      description: "Update a user's role (admin)",
      params: {
        type: "object",
        properties: { userId: { type: "string" } },
        required: ["userId"],
      },
      body: {
        type: "object",
        properties: { roleId: { type: "string" } },
        required: ["roleId"],
      },
      response: {
        200: userSchema,
        400: errorResponseSchema,
        404: errorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const params = request.params as { userId: string };
      const body = request.body as { roleId?: string };

      if (!body?.roleId) {
        return reply.code(400).send({ error: "roleId is required" });
      }

      const [role] = await db.select().from(roles).where(eq(roles.id, body.roleId)).limit(1);
      if (!role) {
        return reply.code(404).send({ error: "Role not found" });
      }

      const [updated] = await db
        .update(users)
        .set({ roleId: body.roleId, updatedAt: new Date() })
        .where(eq(users.id, params.userId))
        .returning();

      if (!updated) {
        return reply.code(404).send({ error: "User not found" });
      }

      return updated;
    },
  });
}

