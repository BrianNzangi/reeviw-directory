import { buildApp } from "./app.js";
import { env } from "./lib/env.js";

async function start() {
  const app = buildApp();

  await app.listen({
    port: env.port,
    host: "0.0.0.0",
  });
}

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
