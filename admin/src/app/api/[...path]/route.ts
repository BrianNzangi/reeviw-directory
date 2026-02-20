import { NextRequest } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3002";

async function proxy(request: NextRequest, paramsPromise: Promise<{ path: string[] }>) {
  const params = await paramsPromise;
  const targetPath = params.path.join("/");
  const targetUrl = `${API_BASE_URL}/api/${targetPath}${request.nextUrl.search}`;

  const bodyText = request.method === "GET" || request.method === "HEAD" ? undefined : await request.text();

  const upstream = await fetch(targetUrl, {
    method: request.method,
    headers: {
      cookie: request.headers.get("cookie") || "",
      "content-type": request.headers.get("content-type") || "application/json",
    },
    body: bodyText,
    redirect: "manual",
  });

  const headers = new Headers(upstream.headers);
  return new Response(upstream.body, {
    status: upstream.status,
    headers,
  });
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(request, params);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(request, params);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(request, params);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(request, params);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(request, params);
}

export async function OPTIONS(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(request, params);
}
