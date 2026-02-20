import { requirePermission } from "@/lib/guards";
import { ToolEditor } from "../tool-editor";

export default async function NewToolPage() {
  await requirePermission("manage_tools");
  return <ToolEditor mode="create" />;
}
