import Link from "next/link";
import { Container } from "@/components/container";
import type { CollectionPost } from "./types";

type SectionGridProps = {
  title: string;
  posts: CollectionPost[];
  showAllHref?: string;
};

export function SectionGrid({ title, posts, showAllHref }: SectionGridProps) {
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {posts.slice(0, 6).map((post) => (
            <article key={post.id}>
              <Link
                href={`/deal/${post.slug}`}
                className="flex items-center gap-3 no-underline hover:text-primary"
              >
                <div className="aspect-video w-28 shrink-0 overflow-hidden rounded bg-muted">
                  {post.coverImageUrl ? (
                    <img src={post.coverImageUrl} alt={post.title} className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div className="min-w-0">
                  <h3 className="line-clamp-3 text-base font-bold leading-snug text-secondary">{post.title}</h3>
                </div>
              </Link>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
