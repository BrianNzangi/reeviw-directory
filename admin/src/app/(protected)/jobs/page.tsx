import { requirePermission } from "@/lib/guards";
import { JobsClient } from "./jobs-client";

export default async function JobsPage() {
  await requirePermission("manage_jobs");
  return <JobsClient />;
}
