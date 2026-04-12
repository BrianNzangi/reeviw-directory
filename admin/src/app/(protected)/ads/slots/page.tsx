import { requirePermission } from "@/lib/guards";
import { AdSlotsClient } from "@/components/ads/ad-slots-client";

export default async function AdSlotsPage() {
  await requirePermission("manage_ads");
  return <AdSlotsClient />;
}
