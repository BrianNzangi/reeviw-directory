import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/guards";
import { PageEditor } from "@/components/pages/page-editor";

const PAGE_LABELS: Record<string, string> = {
  "about-bargainly-deals": "About Bargainly Deals",
  "about-our-ads": "About our ads",
  faq: "FAQ",
  support: "Support",
  "privacy-policy": "Privacy Policy",
  terms: "Terms",
  advertise: "Advertise",
};

export default async function AdminPageEditor({ params }: { params: Promise<{ slug: string }> }) {
  await requirePermission("manage_posts");
  const { slug } = await params;
  const label = PAGE_LABELS[slug];
  if (!label) {
    notFound();
  }
  return <PageEditor slug={slug} label={label} />;
}
