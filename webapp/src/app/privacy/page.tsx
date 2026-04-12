import { notFound } from "next/navigation";
import { PageView } from "@/components/shared/page/page-view";
import { getManagedPageData } from "@/lib/page/data";

export default async function PrivacyPage() {
  const page = await getManagedPageData("privacy-policy");
  if (!page) notFound();

  return <PageView page={page} />;
}
