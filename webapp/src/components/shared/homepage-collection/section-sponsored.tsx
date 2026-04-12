import Link from "next/link";
import { Container } from "@/components/container";
import { NewsletterCard } from "./newsletter-card";
import type { CollectionPost } from "./types";

type SectionSponsoredProps = {
  posts: CollectionPost[];
};

export function SectionSponsored({ posts }: SectionSponsoredProps) {
  return (
    <section className="py-6 sm:py-8">
      <Container>
        <div className="grid items-stretch gap-4 lg:grid-cols-[minmax(0,1fr)_432px]">
          <div className="h-full">
            {posts.length ? (
              <div className="grid gap-4 md:grid-cols-2">
                {posts.slice(0, 4).map((post) => (
                  <article key={post.id}>
                    <Link
                      href={`/deal/${post.slug}`}
                      className="grid grid-cols-[8rem_minmax(0,1fr)] items-stretch gap-3 no-underline hover:text-primary"
                    >
                      <div className="h-full w-32 overflow-hidden rounded bg-muted">
                        {post.coverImageUrl ? (
                          <img src={post.coverImageUrl} alt={post.title} className="aspect-video object-cover" />
                        ) : null}
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col justify-center">
                        <span className="mb-2 inline-flex text-[10px] font-semibold uppercase tracking-wide text-brand-primary-900">
                          Sponsored
                        </span>
                        <h3 className="line-clamp-3 text-sm font-bold leading-snug text-secondary">
                          {post.title}
                        </h3>
                      </div>
                    </Link>
                  </article>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No sponsored blogs yet.</p>
            )}
          </div>

          <NewsletterCard variant="stacked" />
        </div>
      </Container>
    </section>
  );
}
