"use client";

import Link from "next/link";
import { InArticleAdSlot } from "@/components/ads/in-article-ad-slot";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type SimilarPostsListProps = {
  baseUrl: string;
  categoryIds: string[];
  currentPostId: string;
  parentCategoryName?: string;
};

type RelatedPost = {
  id: string;
  title: string;
  slug: string;
  coverImageUrl?: string | null;
  publishedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

type RelatedPostsResponse =
  | RelatedPost[]
  | {
    page?: number;
    pageSize?: number;
    hasMore?: boolean;
    items?: RelatedPost[];
  };

const PAGE_SIZE = 6;
const MAX_TOTAL_POSTS = 50;

function toAbsoluteImageUrl(rawUrl: string | null | undefined, baseUrl: string) {
  const value = rawUrl?.trim();
  if (!value) return undefined;

  if (value.startsWith("data:image/")) return value;
  if (value.startsWith("//")) return `https:${value}`;

  try {
    return new URL(value).toString();
  } catch {
    if (value.startsWith("/")) return `${baseUrl}${value}`;
    return `${baseUrl}/${value.replace(/^\.?\//, "")}`;
  }
}

function getPublishedLabel(post: RelatedPost) {
  const raw = post.publishedAt || post.createdAt || post.updatedAt;
  if (!raw) return "Published recently";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "Published recently";
  return `Published ${date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
}

export function SimilarPostsList({
  baseUrl,
  categoryIds,
  currentPostId,
  parentCategoryName,
}: SimilarPostsListProps) {
  const [posts, setPosts] = useState<RelatedPost[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const pageRef = useRef(0);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const hasMoreRef = useRef(true);
  const isLoadingRef = useRef(false);

  const normalizedBaseUrl = useMemo(() => baseUrl.replace(/\/$/, ""), [baseUrl]);
  const categoryIdsKey = useMemo(() => categoryIds.filter(Boolean).join(","), [categoryIds]);

  const fetchNextPage = useCallback(async () => {
    if (!categoryIdsKey) return;
    if (!hasMoreRef.current || isLoadingRef.current) return;
    if (seenIdsRef.current.size >= MAX_TOTAL_POSTS) {
      hasMoreRef.current = false;
      setHasMore(false);
      return;
    }

    isLoadingRef.current = true;
    setIsLoading(true);

    const nextPage = pageRef.current + 1;

    try {
      const params = new URLSearchParams();
      params.set("categoryIds", categoryIdsKey);
      params.set("page", String(nextPage));
      params.set("pageSize", String(PAGE_SIZE));

      const response = await fetch(`${normalizedBaseUrl}/api/posts?${params.toString()}`, { cache: "no-store" });
      if (!response.ok) {
        hasMoreRef.current = false;
        setHasMore(false);
        return;
      }

      const data = (await response.json()) as RelatedPostsResponse;
      const items = Array.isArray(data) ? data : data.items ?? [];
      const hasMoreFromApi = Array.isArray(data)
        ? items.length >= PAGE_SIZE
        : Boolean(data.hasMore);

      const filtered = items.filter((item) => item.id !== currentPostId && !seenIdsRef.current.has(item.id));
      const remaining = Math.max(0, MAX_TOTAL_POSTS - seenIdsRef.current.size);
      const capped = remaining > 0 ? filtered.slice(0, remaining) : [];
      capped.forEach((item) => seenIdsRef.current.add(item.id));
      const normalized = capped.map((item) => ({
        ...item,
        coverImageUrl: toAbsoluteImageUrl(item.coverImageUrl, normalizedBaseUrl) ?? null,
      }));
      setPosts((prev) => [...prev, ...normalized]);

      pageRef.current = nextPage;
      const hitCap = seenIdsRef.current.size >= MAX_TOTAL_POSTS;
      const nextHasMore = hasMoreFromApi && !hitCap;
      hasMoreRef.current = nextHasMore;
      setHasMore(nextHasMore);
      setHasLoadedOnce(true);
    } catch {
      hasMoreRef.current = false;
      setHasMore(false);
      setHasLoadedOnce(true);
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }, [categoryIdsKey, currentPostId, normalizedBaseUrl]);

  useEffect(() => {
    setPosts([]);
    setHasMore(true);
    setIsLoading(false);
    setHasLoadedOnce(false);
    pageRef.current = 0;
    seenIdsRef.current = new Set<string>();
    hasMoreRef.current = true;
    isLoadingRef.current = false;
    fetchNextPage().catch(() => null);
  }, [fetchNextPage]);

  useEffect(() => {
    const target = sentinelRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry?.isIntersecting) return;
        fetchNextPage().catch(() => null);
      },
      { rootMargin: "500px 0px 500px 0px" },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [fetchNextPage]);

  if (!categoryIdsKey) return null;

  return (
    <div>
      <h2 className="text-xs font-black uppercase tracking-[0.1em] text-brand-primary-900">
        {`More in ${parentCategoryName || "Related Deals"}`}
      </h2>

      {posts.length ? (
        <div className="mt-3">
          {posts.map((item, index) => (
            <div key={item.id}>
              <article className="border-b border-border/70">
                <Link href={`/deal/${item.slug}`} className="block py-4 text-inherit no-underline hover:text-primary">
                  <div className="flex flex-col gap-4 sm:flex-row">
                    <div className="aspect-video w-full shrink-0 overflow-hidden rounded bg-muted sm:w-48">
                      {item.coverImageUrl ? (
                        <img src={item.coverImageUrl} alt={item.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                          Deal
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-primary-900">
                        {parentCategoryName || "Related Deals"}
                      </p>
                      <h3 className="mt-2 text-2xl font-black leading-tight text-secondary">
                        {item.title}
                      </h3>
                      <p className="mt-3 text-sm font-medium text-secondary/70">{getPublishedLabel(item)}</p>
                    </div>
                  </div>
                </Link>
              </article>

              {(index + 1) % 2 === 0 ? (
                <div className="py-4">
                  <InArticleAdSlot className="mx-auto" />
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      {!isLoading && hasLoadedOnce && posts.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">No related blogs found yet.</p>
      ) : null}

      {isLoading ? (
        <p className="mt-3 text-sm text-muted-foreground">Loading more deals...</p>
      ) : null}

      <div ref={sentinelRef} className="h-2 w-full" aria-hidden="true" />

      {!hasMore && posts.length > 0 ? (
        <p className="mt-2 text-xs text-muted-foreground">You&apos;ve reached the end.</p>
      ) : null}
    </div>
  );
}

