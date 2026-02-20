import { requirePermission } from "@/lib/guards";
import { ComparisonsClient } from "./comparisons-client";

export default async function ComparisonsPage() {
  await requirePermission("manage_comparisons");
  return <ComparisonsClient />;
}
