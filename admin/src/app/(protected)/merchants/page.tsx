import { requirePermission } from "@/lib/guards";
import { MerchantsClient } from "@/components/products/merchants-client";

export default async function MerchantsPage() {
  await requirePermission("manage_products");
  return <MerchantsClient />;
}
