import fp from "fastify-plugin";
import { auth } from "../lib/auth.js";

export default fp(async (fastify) => {
  fastify.decorate("auth", auth);
});