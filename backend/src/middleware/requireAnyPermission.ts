import type { FastifyReply, FastifyRequest } from "fastify";
import { hasPermission } from "../lib/rbac.js";

export function requireAnyPermission(permissions: string[]) {
  return async function permissionGuard(request: FastifyRequest, reply: FastifyReply) {
    const access = request.access;
    if (!access) {
      reply.code(403).send({ error: "No role assigned" });
      return;
    }

    if (access.roleName === "superadmin") {
      return;
    }

    const allowed = permissions.some((permission) => hasPermission(access, permission));
    if (!allowed) {
      reply.code(403).send({ error: `Missing permission: ${permissions.join(" or ")}` });
    }
  };
}
