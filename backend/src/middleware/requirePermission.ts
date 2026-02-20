import type { FastifyReply, FastifyRequest } from "fastify";
import { hasPermission } from "../lib/rbac.js";

export function requirePermission(permission: string) {
  return async function permissionGuard(request: FastifyRequest, reply: FastifyReply) {
    if (!request.access) {
      reply.code(401).send({ error: "Unauthorized" });
      return;
    }

    if (!hasPermission(request.access, permission)) {
      reply.code(403).send({ error: `Missing permission: ${permission}` });
      return;
    }
  };
}
