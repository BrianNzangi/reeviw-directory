import { syncImpact } from "./syncImpact.js";
import { syncPartnerstack } from "./syncPartnerstack.js";

async function run() {
  await syncPartnerstack();
  await syncImpact();
}

run().catch((error) => {
  console.error("Daily job run failed", error);
  process.exit(1);
});
