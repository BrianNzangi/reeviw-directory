import { notFound } from "next/navigation";
import { DealPageView } from "@/components/deal";
import { getDealPageData } from "@/lib/deal/data";

type DealBlogPageProps = {
  params: { slug: string } | Promise<{ slug: string }>;
};

export default async function DealBlogPage({ params }: DealBlogPageProps) {
  const resolvedParams = await Promise.resolve(params);
  const data = await getDealPageData(resolvedParams.slug);
  if (!data) notFound();

  return <DealPageView {...data} />;
}
