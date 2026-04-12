import { syncAmazon } from "./syncAmazon.js";
import { syncAwin } from "./syncAwin.js";
import { syncImpact } from "./syncImpact.js";
import { syncPartnerstack } from "./syncPartnerstack.js";

async function run() {
  await syncAmazon();
  await syncAwin();
  await syncPartnerstack();
  await syncImpact();
}

run().catch((error) => {
  console.error("Daily job run failed", error);
  process.exit(1);
});
