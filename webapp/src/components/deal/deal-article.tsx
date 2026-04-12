import Link from "next/link";
import { Fragment } from "react";
import { NewsletterCard } from "@/components/shared/homepage-collection/newsletter-card";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import type { DealPageData } from "@/types/deal";

type DealArticleProps = Pick<
  DealPageData,
  | "post"
  | "categoryLabel"
  | "publishedLabel"
  | "suggested"
  | "primaryOfferUrl"
  | "primaryMerchantName"
  | "shareUrl"
  | "shareTitle"
>;

function normalizeSlug(value: string) {
  return value.trim().toLowerCase();
}

function getCategoryBreadcrumb(post: DealPageData["post"]) {
  const linkedCategories = post.categories ?? [];
  if (!linkedCategories.length) return [];

  const byId = new Map(linkedCategories.map((item) => [item.id, item]));
  const preferred =
    linkedCategories.find((item) => normalizeSlug(item.slug) === normalizeSlug(post.postType))
    || linkedCategories[0];

  const parent = preferred.parentId ? byId.get(preferred.parentId) : undefined;
  const trail = [parent, preferred].filter(
    (item): item is NonNullable<typeof item> => Boolean(item?.slug),
  );

  return trail.map((item) => ({
    id: item.id,
    label: item.name,
    href: `/${item.slug}`,
  }));
}

export function DealArticle({
  post,
  categoryLabel,
  publishedLabel,
  suggested,
  primaryOfferUrl,
  primaryMerchantName,
  shareUrl,
  shareTitle,
}: DealArticleProps) {
  const breadcrumbItems = getCategoryBreadcrumb(post);

  return (
    <article className="p-4 sm:p-6">
      <div>
        {breadcrumbItems.length ? (
          <Breadcrumb>
            <BreadcrumbList className="text-xs font-semibold uppercase tracking-[0.12em] text-secondary/65">
              {breadcrumbItems.map((item, index) => (
                <Fragment key={item.id}>
                  <BreadcrumbItem>
                    <Link
                      href={item.href}
                      className={`transition-colors hover:text-foreground ${
                        index === breadcrumbItems.length - 1
                          ? "font-bold text-brand-primary-900"
                          : ""
                      }`}
                    >
                      {item.label}
                    </Link>
                  </BreadcrumbItem>
                  {index < breadcrumbItems.length - 1 ? (
                    <BreadcrumbSeparator className="text-secondary/40">
                      &gt;
                    </BreadcrumbSeparator>
                  ) : null}
                </Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        ) : (
          <span className="text-xs font-bold uppercase tracking-[0.12em] text-brand-primary-900">
            {categoryLabel}
          </span>
        )}
      </div>

      <h1 className="mt-3 text-3xl font-black leading-tight text-secondary sm:text-4xl">
        {post.title}
      </h1>

      {post.excerpt ? (
        <p className="mt-3 text-base leading-relaxed text-secondary/80">{post.excerpt}</p>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-semibold text-secondary/70">
        <span>{publishedLabel}</span>
        <span aria-hidden="true">|</span>
        <span>By The Bargainly Staff</span>
        <span className="ml-auto flex items-center gap-2">
          <a
            href={`https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareTitle}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand-primary-900 text-[10px] font-black text-white hover:opacity-90"
            aria-label="Share on X"
          >
            X
          </a>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand-secondary-700 text-[10px] font-black text-white hover:opacity-90"
            aria-label="Share on Facebook"
          >
            f
          </a>
          <a
            href={`mailto:?subject=${shareTitle}&body=${shareUrl}`}
            className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand-secondary-500 text-[10px] font-black text-white hover:opacity-90"
            aria-label="Share via email"
          >
            @
          </a>
        </span>
      </div>

      <div className="mt-5 overflow-hidden rounded-md">
        {post.coverImageUrl ? (
          <img src={post.coverImageUrl} alt={post.title} className="aspect-video object-cover" />
        ) : (
          <div className="flex aspect-video items-center justify-center text-sm font-semibold text-muted-foreground">
            Deal image coming soon
          </div>
        )}
      </div>

      <div className="mx-auto max-w-2xl">
        {post.content ? (
          <div
            className="mt-5 space-y-4 text-xl leading-8 text-secondary/90 [&_a]:text-brand-primary-100 [&_a]:underline [&_p]:mb-4"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        ) : null}

        {suggested.length ? (
          <div className="mt-6 border-t border-border pt-4">
            <h2 className="text-xs font-black uppercase tracking-widest text-brand-primary-900">
              Suggested Reading
            </h2>
            <ul className="mt-2 space-y-2">
              {suggested.map((item) => (
                <li key={item.id} className="border-b border-border pb-2 last:border-b-0">
                  <Link href={`/deal/${item.slug}`} className="text-sm font-semibold text-secondary hover:text-primary">
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {post.conclusionHtml ? (
          <div
            className="mt-6 border-t border-border pt-4 text-xl leading-8 text-secondary/90 [&_a]:text-brand-primary-900 [&_a]:underline [&_p]:mb-4"
            dangerouslySetInnerHTML={{ __html: post.conclusionHtml }}
          />
        ) : null}

        <div className="mt-6">
          {primaryOfferUrl ? (
            <a
              href={primaryOfferUrl}
              target="_blank"
              rel="noreferrer sponsored"
              className="block w-full rounded-sm bg-brand-primary-900 px-4 py-2 text-center text-sm font-bold text-white hover:opacity-95"
            >
              {`Check Deal at ${primaryMerchantName}`}
            </a>
          ) : (
            <button
              type="button"
              disabled
              className="w-full cursor-not-allowed rounded-sm bg-brand-primary-900/60 px-4 py-2 text-sm font-bold text-white"
            >
              Deal link unavailable
            </button>
          )}
        </div>

        <NewsletterCard className="mt-6 h-fit" />
      </div>
    </article>
  );
}
