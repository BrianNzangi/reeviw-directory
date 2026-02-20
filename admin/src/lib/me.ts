import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { AdminMe } from "./permissions";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3002";

export async function getMeServer(): Promise<AdminMe | null> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/me`, {
      method: "GET",
      headers: {
        cookie: cookieHeader,
      },
      cache: "no-store",
    });
  } catch {
    // If backend is temporarily unavailable, treat as logged-out instead of crashing login route.
    return null;
  }

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Failed to load /api/me: ${response.status}`);
  }

  return response.json() as Promise<AdminMe>;
}

export async function requireMe() {
  const me = await getMeServer();
  if (!me?.user) {
    redirect("/login");
  }
  return me;
}
