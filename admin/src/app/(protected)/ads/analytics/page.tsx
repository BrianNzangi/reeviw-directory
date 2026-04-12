import { requirePermission } from "@/lib/guards";
import { AdAnalyticsClient } from "@/components/ads/ad-analytics-client";

export default async function AdAnalyticsPage() {
  await requirePermission("manage_ads");
  return <AdAnalyticsClient />;
}
