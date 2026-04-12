import { requirePermission } from "@/lib/guards";
import { AffiliateProgramDetailClient } from "@/components/affiliates/affiliate-program-detail-client";

export default async function AffiliateProgramDetailPage() {
  await requirePermission("manage_affiliates");
  return <AffiliateProgramDetailClient />;
}
