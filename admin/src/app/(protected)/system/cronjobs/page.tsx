import { requirePermission } from "@/lib/guards";
import { CronJobsClient } from "./cronjobs-client";

export default async function CronJobsPage() {
  await requirePermission("manage_jobs");
  return <CronJobsClient />;
}
