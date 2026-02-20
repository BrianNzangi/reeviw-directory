import { requirePermission } from "@/lib/guards";
import { CategoriesClient } from "./categories-client";

export default async function CategoriesPage() {
  await requirePermission("manage_categories");
  return <CategoriesClient />;
}
