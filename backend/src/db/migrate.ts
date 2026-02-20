import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, pool } from "./index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  await migrate(db, {
    migrationsFolder: path.resolve(__dirname, "./migrations"),
  });
  await pool.end();
}

run().catch(async (error) => {
  console.error("Migration failed", error);
  await pool.end();
  process.exit(1);
});
