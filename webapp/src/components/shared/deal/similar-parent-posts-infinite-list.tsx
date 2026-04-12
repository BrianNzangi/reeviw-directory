"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type SimilarParentPostsInfiniteListProps = {
  baseUrl: string;
  categoryIds: string[];
  currentPostId: string;
  parentCategoryName?: string;
};

type RelatedPost = {
  id: string;
  title: string;
  slug: string;
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

const PAGE_SIZE = 10;

function getPublishedLabel(post: RelatedPost) {
  const raw = post.publishedAt || post.createdAt || post.updatedAt;
  if (!raw) return "Published recently";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "Published recently";
  return `Published ${date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
}

export function SimilarParentPostsInfiniteList({
  baseUrl,
  categoryIds,
  currentPostId,
  parentCategoryName,
}: SimilarParentPostsInfiniteListProps) {
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
      filtered.forEach((item) => seenIdsRef.current.add(item.id));
      setPosts((prev) => [...prev, ...filtered]);

      pageRef.current = nextPage;
      hasMoreRef.current = hasMoreFromApi;
      setHasMore(hasMoreFromApi);
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
    <div className="mt-6 border-t border-border pt-4">
      <h2 className="text-xs font-black uppercase tracking-widest text-brand-primary-900">
        {`More in ${parentCategoryName || "Related Deals"}`}
      </h2>

      {posts.length ? (
        <ul className="mt-3 space-y-2">
          {posts.map((item) => (
            <li key={item.id} className="border-b border-border pb-2 last:border-b-0">
              <Link href={`/deal/${item.slug}`} className="text-sm font-semibold text-secondary hover:text-primary">
                {item.title}
              </Link>
              <p className="mt-1 text-xs text-muted-foreground">{getPublishedLabel(item)}</p>
            </li>
          ))}
        </ul>
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


