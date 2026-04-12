import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { headers } from "next/headers";

const githubClientId = process.env.GITHUB_CLIENT_ID;
const githubClientSecret = process.env.GITHUB_CLIENT_SECRET;

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_BASE_URL || "http://localhost:3003",
  secret: process.env.BETTER_AUTH_SECRET || "dev-only-better-auth-secret-change-me",
  emailAndPassword: {
    enabled: true,
  },
  ...(githubClientId && githubClientSecret
    ? {
        socialProviders: {
          github: {
            clientId: githubClientId,
            clientSecret: githubClientSecret,
          },
        },
      }
    : {}),
  plugins: [nextCookies()],
});

export async function getServerSession() {
  return auth.api.getSession({
    headers: await headers(),
  });
}
