import "dotenv/config";
import { createServer } from "node:net";
import { spawn } from "node:child_process";

const startPort = Number(process.env.DRIZZLE_STUDIO_PORT || 4983);
const maxTries = 20;

function findFreePort(port, triesLeft) {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once("error", (error) => {
      server.close();
      if (triesLeft <= 0 || error.code !== "EADDRINUSE") {
        reject(error);
        return;
      }
      resolve(findFreePort(port + 1, triesLeft - 1));
    });
    server.once("listening", () => {
      server.close(() => resolve(port));
    });
    server.listen(port, "127.0.0.1");
  });
}

async function run() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is required to run Drizzle Studio.");
    process.exit(1);
  }

  const port = await findFreePort(startPort, maxTries);
  const command = `npx drizzle-kit studio --port ${port}`;
  const child = spawn(command, {
    stdio: "inherit",
    env: process.env,
    shell: true,
  });

  child.on("exit", (code) => {
    process.exit(code ?? 0);
  });
}

run().catch((error) => {
  console.error("Failed to start Drizzle Studio", error);
  process.exit(1);
});
