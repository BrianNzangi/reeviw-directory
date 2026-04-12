import { requirePermission } from "@/lib/guards";
import { ProductsClient } from "@/components/products/products-client";

export default async function ProductsPage() {
  await requirePermission("manage_products");
  return <ProductsClient />;
}
