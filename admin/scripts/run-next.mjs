import { spawn } from "node:child_process";
import net from "node:net";
import path from "node:path";
import process from "node:process";

const command = process.argv[2] ?? "dev";
const fallbackStartPort = 3003;
const nextBin = path.resolve("node_modules/next/dist/bin/next");

function isPortOpen(port) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once("error", () => {
      resolve(false);
    });

    server.once("listening", () => {
      server.close(() => resolve(true));
    });

    server.listen(port);
  });
}

async function resolvePort() {
  const requestedPort = process.env.PORT;

  if (requestedPort) {
    return requestedPort;
  }

  if (command !== "dev") {
    return String(fallbackStartPort);
  }

  for (let port = fallbackStartPort; port < fallbackStartPort + 10; port += 1) {
    if (await isPortOpen(port)) {
      if (port !== fallbackStartPort) {
        console.log(
          `Port ${fallbackStartPort} is busy, starting admin dev server on http://localhost:${port}.`,
        );
      }

      return String(port);
    }
  }

  throw new Error(
    `No open port found in range ${fallbackStartPort}-${fallbackStartPort + 9} for admin dev server.`,
  );
}

const port = await resolvePort();

const child = spawn(process.execPath, [nextBin, command, "-p", port], {
  stdio: "inherit",
  env: process.env,
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});

child.on("error", (error) => {
  console.error(error);
  process.exit(1);
});
