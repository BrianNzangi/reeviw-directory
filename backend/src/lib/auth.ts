import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { username } from "better-auth/plugins";
import { db } from "../db/index.js";
import { authAccount, authSession, authUser, authVerification } from "../db/schema.js";
import { env } from "./env.js";

const LOCAL_DEV_PORT_START = 3003;
const LOCAL_DEV_PORT_COUNT = 10;

function normalizeOrigin(input: string | null | undefined) {
  if (!input) {
    return null;
  }

  try {
    return new URL(input).origin;
  } catch {
    return null;
  }
}

function isAllowedLocalDevOrigin(origin: string) {
  try {
    const url = new URL(origin);
    const isLocalHost = url.hostname === "localhost" || url.hostname === "127.0.0.1";
    const port = Number(url.port);

    return isLocalHost && Number.isInteger(port) && port >= LOCAL_DEV_PORT_START && port < LOCAL_DEV_PORT_START + LOCAL_DEV_PORT_COUNT;
  } catch {
    return false;
  }
}

function getTrustedOrigins(request?: Request) {
  const requestOrigins = [
    normalizeOrigin(request?.headers.get("origin")),
    normalizeOrigin(request?.headers.get("referer")),
  ]
    .filter((origin): origin is string => origin !== null)
    .filter((origin) => isAllowedLocalDevOrigin(origin));

  return Array.from(
    new Set([
      "http://localhost:3001",
      "http://127.0.0.1:3001",
      "http://localhost:3003",
      "http://127.0.0.1:3003",
      "http://admin:3001",
      ...requestOrigins,
      ...env.betterAuthTrustedOrigins,
    ]),
  );
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: authUser,
      session: authSession,
      account: authAccount,
      verification: authVerification,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
  advanced: {
    database: {
      generateId: () => crypto.randomUUID(),
    },
  },
  secret: env.betterAuthSecret,
  baseURL: env.betterAuthUrl,
  trustedOrigins: async (request) => getTrustedOrigins(request),
  csrfProtection: {
    enabled: false, // Disable CSRF protection for admin interface
  },
  plugins: [
    username({
      minUsernameLength: 3,
      maxUsernameLength: 30,
      usernameValidator: (username) => {
        // Allow only alphanumeric characters, underscores, and dots
        return /^[a-zA-Z0-9_.]+$/.test(username);
      },
      displayUsernameValidator: (displayUsername) => {
        // Allow alphanumeric characters, underscores, hyphens, and spaces
        return /^[a-zA-Z0-9 _-]+$/.test(displayUsername);
      },
      usernameNormalization: (username) => {
        return username.toLowerCase();
      },
      displayUsernameNormalization: (displayUsername) => {
        return displayUsername;
      },
    })
  ],
});
