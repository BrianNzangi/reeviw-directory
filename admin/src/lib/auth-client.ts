import { createAuthClient } from "better-auth/react";

const SERVER_API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3002";
const CLIENT_AUTH_BASE_URL =
  typeof window !== "undefined"
    ? `${window.location.origin}/admin/api/auth`
    : `${SERVER_API_BASE_URL}/api/auth`;

export const authClient = createAuthClient({
  baseURL: CLIENT_AUTH_BASE_URL,
  fetchOptions: {
    credentials: "include",
  },
});
