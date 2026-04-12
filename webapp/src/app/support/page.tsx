import { notFound } from "next/navigation";
import { PageView } from "@/components/shared/page/page-view";
import { getManagedPageData } from "@/lib/page/data";

export default async function SupportPage() {
  const page = await getManagedPageData("support");
  if (!page) notFound();

  return <PageView page={page} />;
}
