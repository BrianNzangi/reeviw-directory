import { notFound } from "next/navigation";
import { PageView } from "@/components/shared/page/page-view";
import { getManagedPageData } from "@/lib/page/data";

export default async function AdvertisePage() {
  const page = await getManagedPageData("advertise");
  if (!page) notFound();

  return <PageView page={page} />;
}
