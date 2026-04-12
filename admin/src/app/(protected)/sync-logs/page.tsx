import { requirePermission } from "@/lib/guards";
import { SyncLogsClient } from "@/components/affiliates/sync-logs-client";

export default async function SyncLogsPage() {
  await requirePermission("manage_affiliates");
  return <SyncLogsClient />;
}
