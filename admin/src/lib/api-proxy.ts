import { NextRequest } from "next/server";
import { Buffer } from "buffer";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3002";
const PROXY_RETRY_DELAYS_MS = [200, 500, 1000];

const PASSTHROUGH_HEADERS = [
  "cookie",
  "content-type",
  "origin",
  "referer",
  "authorization",
  "user-agent",
  "x-csrf-token",
  "csrf-token",
  "x-xsrf-token",
];

export async function proxyToBackendApi(request: NextRequest, pathSegments: string[]) {
  const targetPath = pathSegments.filter(Boolean).join("/");
  const targetUrl = `${API_BASE_URL}/api/${targetPath}${request.nextUrl.search}`;
  const rawBody =
    request.method === "GET" || request.method === "HEAD" ? undefined : await request.arrayBuffer();
  const bodyBuffer = rawBody && rawBody.byteLength > 0 ? Buffer.from(rawBody) : undefined;
  const upstreamHeaders = new Headers();

  for (const header of PASSTHROUGH_HEADERS) {
    const value = request.headers.get(header);
    if (value) {
      upstreamHeaders.set(header, value);
    }
  }

  const forwardedProto = request.headers.get("x-forwarded-proto") || request.nextUrl.protocol.replace(":", "");
  const forwardedHost = request.headers.get("x-forwarded-host") || request.headers.get("host");

  if (!upstreamHeaders.has("origin")) {
    if (forwardedHost) {
      upstreamHeaders.set("origin", `${forwardedProto}://${forwardedHost}`);
    } else {
      upstreamHeaders.set("origin", request.nextUrl.origin);
    }
  }

  if (!upstreamHeaders.has("referer")) {
    if (forwardedHost) {
      upstreamHeaders.set("referer", `${forwardedProto}://${forwardedHost}`);
    } else {
      upstreamHeaders.set("referer", request.nextUrl.origin);
    }
  }

  if (!upstreamHeaders.has("content-type") && bodyBuffer !== undefined) {
    upstreamHeaders.set("content-type", "application/json");
  }

  let upstream: Response | null = null;
  let lastError: unknown = null;

  for (let attempt = 0; attempt <= PROXY_RETRY_DELAYS_MS.length; attempt += 1) {
    try {
      upstream = await fetch(targetUrl, {
        method: request.method,
        headers: upstreamHeaders,
        body: bodyBuffer,
        redirect: "manual",
      });
      break;
    } catch (error) {
      lastError = error;
      if (attempt === PROXY_RETRY_DELAYS_MS.length) {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, PROXY_RETRY_DELAYS_MS[attempt]));
    }
  }

  if (!upstream) {
    const message =
      lastError instanceof Error && lastError.message
        ? `Backend API is unavailable: ${lastError.message}`
        : "Backend API is unavailable.";

    return Response.json(
      { error: message },
      {
        status: 503,
        headers: {
          "cache-control": "no-store",
        },
      },
    );
  }

  return new Response(upstream.body, {
    status: upstream.status,
    headers: new Headers(upstream.headers),
  });
}
