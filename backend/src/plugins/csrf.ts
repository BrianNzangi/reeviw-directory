import { FastifyPluginAsync } from "fastify";
import { FastifyRequest } from "fastify";
import fastifyCookie from "@fastify/cookie";
import fastifyCsrf from "@fastify/csrf-protection";

const csrfPlugin: FastifyPluginAsync = async (fastify) => {
  // Register cookie plugin for CSRF protection
  await fastify.register(fastifyCookie, {
    secret: process.env.COOKIE_SECRET || "your-secret-key-change-in-production",
    parseOptions: {}
  });

  // Register CSRF protection plugin
  await fastify.register(fastifyCsrf, {
    cookieKey: "_csrf",
    cookieOpts: {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      signed: true
    },
    getToken: (req: FastifyRequest) => {
      // Custom token extraction - check headers first for better performance
      return req.headers["csrf-token"] || 
             req.headers["x-csrf-token"] || 
             req.headers["x-xsrf-token"] ||
             (req.body as any)?._csrf;
    }
  });

};

export default csrfPlugin;
