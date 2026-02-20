import type { FastifyReply, FastifyRequest } from "fastify";
import { auth } from "../lib/auth.js";
import { env } from "../lib/env.js";
import {
  ensureAppUserByAuthIdentity,
  getAccessContext,
  setUserRole,
} from "../lib/rbac.js";

function toHeadersObject(request: FastifyRequest): Headers {
  const headers = new Headers();

  for (const [key, value] of Object.entries(request.headers)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        headers.append(key, item);
      }
    } else if (typeof value === "string") {
      headers.set(key, value);
    }
  }

  return headers;
}

export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  const session = await auth.api.getSession({
    headers: toHeadersObject(request),
  });

  if (!session?.user?.id || !session.user.email) {
    reply.code(401).send({ error: "Unauthorized" });
    return;
  }

  const appUser = await ensureAppUserByAuthIdentity({
    id: session.user.id,
    email: session.user.email,
  });

  if (
    env.superadminEmails.includes(session.user.email.toLowerCase()) &&
    request.headers["x-role-bootstrap"] === "superadmin"
  ) {
    await setUserRole(appUser.id, "superadmin");
  }

  const access = await getAccessContext(appUser.id);
  if (!access) {
    reply.code(403).send({ error: "No role assigned" });
    return;
  }

  request.session = session;
  request.authUser = appUser;
  request.access = access;
}
