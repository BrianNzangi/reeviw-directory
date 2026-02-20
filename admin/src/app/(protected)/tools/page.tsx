import { requirePermission } from "@/lib/guards";
import { ToolsClient } from "./tools-client";

export default async function ToolsPage() {
  await requirePermission("manage_tools");
  return <ToolsClient />;
}
