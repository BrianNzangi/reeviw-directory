import { requirePermission } from "@/lib/guards";
import { ProductEditor } from "@/components/products/product-editor";

export default async function NewProductPage() {
  await requirePermission("manage_products");
  return <ProductEditor mode="create" />;
}
