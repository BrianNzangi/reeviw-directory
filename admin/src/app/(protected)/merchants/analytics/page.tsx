import { requirePermission } from "@/lib/guards";
import { MerchantAnalyticsClient } from "./analytics-client";

export default async function MerchantAnalyticsPage() {
  await requirePermission("manage_products");
  return <MerchantAnalyticsClient />;
}
