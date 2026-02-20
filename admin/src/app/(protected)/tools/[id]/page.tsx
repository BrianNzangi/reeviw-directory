import { requirePermission } from "@/lib/guards";
import { ToolEditor } from "../tool-editor";

export default async function EditToolPage({ params }: { params: { id: string } }) {
  await requirePermission("manage_tools");
  return <ToolEditor mode="edit" toolId={params.id} />;
}
