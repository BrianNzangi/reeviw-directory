import { requirePermission } from "@/lib/guards";
import { AmazonImportClient } from "@/components/amazon/amazon-import-client";

export default async function AmazonImportPage() {
  await requirePermission("manage_products");
  return <AmazonImportClient />;
}
