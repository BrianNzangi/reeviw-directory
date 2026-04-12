import { NextRequest } from "next/server";
import { proxyToBackendApi } from "@/lib/api-proxy";

async function proxy(request: NextRequest, paramsPromise: Promise<{ all: string[] }>) {
  const params = await paramsPromise;
  return proxyToBackendApi(request, ["auth", ...params.all]);
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ all: string[] }> }) {
  return proxy(request, params);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ all: string[] }> }) {
  return proxy(request, params);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ all: string[] }> }) {
  return proxy(request, params);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ all: string[] }> }) {
  return proxy(request, params);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ all: string[] }> }) {
  return proxy(request, params);
}

export async function OPTIONS(request: NextRequest, { params }: { params: Promise<{ all: string[] }> }) {
  return proxy(request, params);
}
