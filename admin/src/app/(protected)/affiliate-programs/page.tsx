import { requirePermission } from "@/lib/guards";
import { AffiliateProgramsClient } from "@/components/affiliates/affiliate-programs-client";

export default async function AffiliateProgramsPage() {
  await requirePermission("manage_affiliates");
  return <AffiliateProgramsClient />;
}
