import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const protectedRoutes = ["/admin"];

  if (protectedRoutes.some((path) => request.nextUrl.pathname.startsWith(path))) {
    // Optional middleware checks.
  }

  return NextResponse.next();
}
