import { requirePermission } from "@/lib/guards";
import { AdCampaignsClient } from "@/components/ads/ad-campaigns-client";

export default async function AdCampaignsPage() {
  await requirePermission("manage_ads");
  return <AdCampaignsClient />;
}
