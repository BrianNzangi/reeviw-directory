import Link from "next/link";
import { Container } from "@/components/container";
import { FeaturedBlogCard, SideBlogCard } from "@/components/shared/blog-cards";
import type { CollectionPost, ParentCategoryLabelResolver } from "./types";

type SectionSplitProps = {
  title: string;
  posts: CollectionPost[];
  getParentCategoryLabel: ParentCategoryLabelResolver;
  showAllHref?: string;
};

export function SectionSplit({
  title,
  posts,
  getParentCategoryLabel,
  showAllHref,
}: SectionSplitProps) {
  const [featured, ...rest] = posts;
  const sidePosts = rest.slice(0, 4);

  return (
    <section className="py-6 sm:py-8">
      <Container>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-black text-secondary sm:text-3xl">{title}</h2>
          {showAllHref ? (
            <Link
              href={showAllHref}
              className="text-sm font-semibold uppercase tracking-[0.08em] text-brand-primary-900 hover:opacity-80"
            >
              Show all
            </Link>
          ) : null}
        </div>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_600px]">
          <FeaturedBlogCard
            title={featured?.title || `${title} deals coming soon`}
            excerpt={featured?.excerpt || "New deals for this section will appear here soon."}
            imageAlt={featured?.title || title}
            imageSrc={featured?.coverImageUrl || undefined}
            href={featured?.slug ? `/deal/${featured.slug}` : undefined}
          />

          <aside>
            <div className="space-y-3 px-4 pb-4">
              {sidePosts.length ? (
                sidePosts.map((post) => (
                  <SideBlogCard
                    key={post.id}
                    title={post.title}
                    imageSrc={post.coverImageUrl || undefined}
                    parentCategory={getParentCategoryLabel(post)}
                    href={`/deal/${post.slug}`}
                  />
                ))
              ) : (
                <p className="py-2 text-sm text-muted-foreground">No posts yet.</p>
              )}
            </div>
          </aside>
        </div>
      </Container>
    </section>
  );
}
