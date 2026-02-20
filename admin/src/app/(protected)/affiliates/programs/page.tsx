import { requirePermission } from "@/lib/guards";
import { ProgramsClient } from "./programs-client";

export default async function AffiliateProgramsPage() {
  await requirePermission("manage_affiliates");
  return <ProgramsClient />;
}
