import { auth } from "../lib/auth.js";
import type { FastifyInstance } from "fastify";
import { env } from "../lib/env.js";

export default async function (fastify: FastifyInstance) {
  fastify.all("/api/auth/*", async (request, reply) => {
    const baseUrl = new URL(env.betterAuthUrl);
    const url = new URL(request.url, baseUrl);
    let requestBody: BodyInit | null | undefined = undefined;
    if (request.body) {
      if (typeof request.body === 'string') {
        requestBody = request.body;
      } else if (typeof request.body === 'object') {
        requestBody = JSON.stringify(request.body);
      } else {
        requestBody = String(request.body);
      }
    }

    const headers = new Headers();
    for (const [key, value] of Object.entries(request.headers)) {
      if (typeof value === "string") {
        headers.set(key, value);
      } else if (Array.isArray(value)) {
        headers.set(key, value.join(","));
      }
    }
    headers.set("host", baseUrl.host);
    if (!headers.has("origin")) {
      headers.set("origin", baseUrl.origin);
    }
    if (!headers.has("referer")) {
      headers.set("referer", baseUrl.origin);
    }
    
    const standardRequest = new Request(url.toString(), {
      method: request.method,
      headers,
      body: requestBody,
    });
    
    const response = await auth.handler(standardRequest);
    
    // Convert the Response back to Fastify reply
    reply.status(response.status);
    response.headers.forEach((value, key) => {
      reply.header(key, value);
    });
    
    const responseBody = await response.text();
    return reply.send(responseBody);
  });
}
