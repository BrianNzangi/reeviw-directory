import { requirePermission } from "@/lib/guards";
import { ComparisonEditor } from "../comparison-editor";

export default async function EditComparisonPage({ params }: { params: { id: string } }) {
  await requirePermission("manage_comparisons");
  return <ComparisonEditor mode="edit" comparisonId={params.id} />;
}
