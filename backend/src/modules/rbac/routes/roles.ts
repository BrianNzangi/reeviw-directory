import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import { db } from "../../../db/index.js";
import { roles, users } from "../../../db/schema.js";
import { requireAnyPermission } from "../../../middleware/requireAnyPermission.js";
import { requireAuth } from "../../../middleware/requireAuth.js";
import { requirePermission } from "../../../middleware/requirePermission.js";
import { errorResponseSchema, roleSchema } from "../schemas/rbacSchemas.js";

export async function registerRoleAdminRoutes(app: FastifyInstance) {
  app.get("/api/roles", {
    preHandler: [requireAuth, requireAnyPermission(["manage_roles", "manage_permissions", "manage_users"])],
    schema: {
      description: "List roles (admin)",
      response: {
        200: { type: "array", items: roleSchema },
      },
    },
    handler: async () => {
      return db.select().from(roles);
    },
  });

  app.post("/api/roles", {
    preHandler: [requireAuth, requirePermission("manage_roles")],
    schema: {
      description: "Create a role (admin)",
      body: {
        type: "object",
        properties: {
          name: { type: "string" },
          description: { type: ["string", "null"] },
        },
        required: ["name"],
      },
      response: {
        201: roleSchema,
        400: errorResponseSchema,
        409: {
          type: "object",
          properties: {
            error: { type: "string" },
            role: roleSchema,
          },
          required: ["error"],
        },
      },
    },
    handler: async (request, reply) => {
      const body = request.body as { name?: string; description?: string };
      if (!body?.name) {
        return reply.code(400).send({ error: "name is required" });
      }

      const [created] = await db
        .insert(roles)
        .values({ name: body.name, description: body.description })
        .onConflictDoNothing({ target: roles.name })
        .returning();

      if (!created) {
        const [existing] = await db.select().from(roles).where(eq(roles.name, body.name)).limit(1);
        return reply.code(409).send({ error: "Role name already exists", role: existing });
      }

      return reply.code(201).send(created);
    },
  });

  app.patch("/api/roles/:id", {
    preHandler: [requireAuth, requirePermission("manage_roles")],
    schema: {
      description: "Update a role (admin)",
      params: {
        type: "object",
        properties: { id: { type: "string" } },
        required: ["id"],
      },
      body: {
        type: "object",
        properties: {
          name: { type: "string" },
          description: { type: "string" },
        },
      },
      response: {
        200: roleSchema,
        400: errorResponseSchema,
        404: errorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const params = request.params as { id: string };
      const body = request.body as Partial<{ name: string; description: string }>;

      if (!body?.name && !body?.description) {
        return reply.code(400).send({ error: "name or description is required" });
      }

      const [updated] = await db
        .update(roles)
        .set({ ...body })
        .where(eq(roles.id, params.id))
        .returning();

      if (!updated) {
        return reply.code(404).send({ error: "Role not found" });
      }

      return updated;
    },
  });

  app.delete("/api/roles/:id", {
    preHandler: [requireAuth, requirePermission("manage_roles")],
    schema: {
      description: "Delete a role (admin)",
      params: {
        type: "object",
        properties: { id: { type: "string" } },
        required: ["id"],
      },
      response: {
        200: {
          type: "object",
          properties: { ok: { type: "boolean" } },
          required: ["ok"],
        },
        404: errorResponseSchema,
        409: errorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const params = request.params as { id: string };
      const [assigned] = await db.select().from(users).where(eq(users.roleId, params.id)).limit(1);
      if (assigned) {
        return reply.code(409).send({ error: "Role is assigned to users" });
      }

      const [deleted] = await db.delete(roles).where(eq(roles.id, params.id)).returning();
      if (!deleted) {
        return reply.code(404).send({ error: "Role not found" });
      }
      return { ok: true };
    },
  });
}

