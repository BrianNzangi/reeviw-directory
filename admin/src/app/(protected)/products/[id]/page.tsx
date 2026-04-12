import { requirePermission } from "@/lib/guards";
import { ProductEditor } from "@/components/products/product-editor";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("manage_products");
  const { id } = await params;
  return <ProductEditor mode="edit" productId={id} />;
}
