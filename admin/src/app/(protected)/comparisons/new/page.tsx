import { requirePermission } from "@/lib/guards";
import { ComparisonEditor } from "../comparison-editor";

export default async function NewComparisonPage() {
  await requirePermission("manage_comparisons");
  return <ComparisonEditor mode="create" />;
}
