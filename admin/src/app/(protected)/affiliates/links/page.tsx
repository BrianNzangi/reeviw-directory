import { requirePermission } from "@/lib/guards";
import { LinksClient } from "./links-client";

export default async function AffiliateLinksPage() {
  await requirePermission("manage_affiliates");
  return <LinksClient />;
}
