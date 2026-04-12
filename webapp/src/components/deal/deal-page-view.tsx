import { Horizontal1AdSlot } from "@/components/ads/horizontal1-ad-slot";
import { Container } from "@/components/container";
import { SimilarPostsList } from "@/components/shared/deal/similar-posts-list";
import type { DealPageData } from "@/types/deal";
import { DealArticle } from "./deal-article";
import { DealPageSidebar } from "./deal-page-sidebar";

export function DealPageView({
  baseUrl,
  post,
  categoryLabel,
  publishedLabel,
  suggested,
  similarCategoryIds,
  parentCategoryName,
  primaryOfferUrl,
  primaryMerchantName,
  shareUrl,
  shareTitle,
}: DealPageData) {
  return (
    <section className="bg-white py-6 sm:py-10">
      <Container>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <DealArticle
            post={post}
            categoryLabel={categoryLabel}
            publishedLabel={publishedLabel}
            suggested={suggested}
            primaryOfferUrl={primaryOfferUrl}
            primaryMerchantName={primaryMerchantName}
            shareUrl={shareUrl}
            shareTitle={shareTitle}
          />

          <DealPageSidebar />
        </div>

        <section className="mt-6">
          <Horizontal1AdSlot className="w-full" />
        </section>

        <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section>
            <SimilarPostsList
              baseUrl={baseUrl}
              categoryIds={similarCategoryIds}
              currentPostId={post.id}
              parentCategoryName={parentCategoryName}
            />
          </section>

          <DealPageSidebar variant="single" />
        </div>
      </Container>
    </section>
  );
}

