import { api } from "@/lib/api/client";
import { buildQuery } from "@/lib/utils/buildQuery";
import type { FeedSyncLog } from "./types";

export async function listFeedSyncLogs(params?: {
  network?: string;
  affiliateProgramId?: string;
  status?: string;
  dateRange?: string;
}) {
  const query = buildQuery({
    network: params?.network,
    affiliate_program_id: params?.affiliateProgramId,
    status: params?.status,
    date_range: params?.dateRange,
  });
  const queryString = query.toString();
  return api.get<FeedSyncLog[]>(`/api/admin/feed-sync-logs${queryString ? `?${queryString}` : ""}`);
}
