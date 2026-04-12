import { notFound } from "next/navigation";
import { PageView } from "@/components/shared/page/page-view";
import { getManagedPageData } from "@/lib/page/data";

export default async function AboutBargainlyDealsPage() {
  const page = await getManagedPageData("about-bargainly-deals");
  if (!page) notFound();

  return <PageView page={page} />;
}
