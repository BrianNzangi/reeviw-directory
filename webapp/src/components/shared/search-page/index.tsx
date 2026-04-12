import Link from "next/link";
import { Search } from "lucide-react";
import { Container } from "@/components/container";
import { CategoryBlogCard } from "@/components/shared/blog-cards";

type SearchCategory = {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
};

type SearchPost = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  coverImageUrl?: string | null;
  postType: string;
  publishedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  categories?: SearchCategory[];
};

type PostsResponse =
  | SearchPost[]
  | {
    page?: number;
    pageSize?: number;
    hasMore?: boolean;
    items?: SearchPost[];
  };

export type SearchPageContentProps = {
  query: string;
  posts: SearchPost[];
};

export type SearchPageDataParams = {
  searchParams?: { q?: string } | Promise<{ q?: string }>;
};

function normalizeSlug(value: string) {
  return value.trim().toLowerCase();
}

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

function buildCategoryLabel(post: SearchPost) {
  const linkedCategories = post.categories ?? [];
  if (!linkedCategories.length) return "RECENT STORY";

  const byId = new Map(linkedCategories.map((item) => [item.id, item]));
  const leaf =
    linkedCategories.find((item) => normalizeSlug(item.slug) === normalizeSlug(post.postType))
    || linkedCategories[0];

  if (!leaf.parentId) return leaf.name.toUpperCase();
  const parent = byId.get(leaf.parentId);
  return `${(parent?.name || leaf.name).toUpperCase()} > ${leaf.name.toUpperCase()}`;
}

function formatPublishedLabel(post: SearchPost) {
  const raw = post.publishedAt || post.createdAt || post.updatedAt;
  if (!raw) return "Published recently";

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return "Published recently";

  return `Published ${parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;
}

async function getPosts(baseUrl: string, query: string) {
  const params = new URLSearchParams({
    pageSize: "9",
  });

  if (query) {
    params.set("q", query);
  }

  try {
    const response = await fetch(`${baseUrl}/api/posts?${params.toString()}`, {
      cache: "no-store",
    });
    if (!response.ok) return [] as SearchPost[];

    const data = (await response.json()) as PostsResponse;
    const items = Array.isArray(data) ? data : (data.items ?? []);

    return items.map((post) => ({
      ...post,
      coverImageUrl: toAbsoluteImageUrl(post.coverImageUrl, baseUrl) ?? null,
    }));
  } catch {
    return [] as SearchPost[];
  }
}

export async function getSearchPageData({ searchParams }: SearchPageDataParams) {
  const resolvedSearch = await Promise.resolve(searchParams ?? {});
  const query = resolvedSearch.q?.trim() ?? "";

  const rawBaseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL
    || process.env.NEXT_PUBLIC_BACKEND_URL
    || "http://localhost:3002";
  const baseUrl = rawBaseUrl.replace(/\/$/, "");

  const posts = await getPosts(baseUrl, query);

  return { query, posts };
}

export function SearchPageContent({ query, posts }: SearchPageContentProps) {
  const heading = query
    ? `Recent stories matching "${query}"`
    : "More Recent Stories from Bargainly";

  return (
    <section className="bg-[linear-gradient(180deg,rgba(255,238,233,0.55)_0%,rgba(248,250,252,0)_20%)] py-8 sm:py-12">
      <Container>
        <div className="rounded-lg border border-border/60 bg-background/95 px-5 py-8 shadow-[0_20px_60px_rgba(15,23,42,0.06)] backdrop-blur sm:px-8 sm:py-10 lg:px-12">
          <form action="/search" method="get" className="pb-8 sm:pb-10">
            <label
              htmlFor="search-query"
              className="text-xl font-medium text-brand-primary-900 sm:text-2xl"
            >
              Search for
            </label>
            <div className="mt-6 flex items-end gap-3 border-b border-brand-primary-900/70 pb-4">
              <input
                id="search-query"
                name="q"
                type="search"
                defaultValue={query}
                placeholder="Deals, beauty, travel, tech..."
                className="h-14 w-full bg-transparent text-2xl font-semibold text-secondary placeholder:text-secondary/35 sm:text-4xl"
              />
              <button
                type="submit"
                className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-border bg-white text-secondary transition hover:border-primary hover:text-primary"
                aria-label="Submit search"
              >
                <Search className="h-6 w-6" />
              </button>
            </div>
          </form>

          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-secondary sm:text-4xl">
                {heading}
              </h1>
              <p className="mt-2 text-sm text-secondary/70">
                {query
                  ? `${posts.length} ${posts.length === 1 ? "story" : "stories"} found`
                  : "Fresh picks from the latest published stories."}
              </p>
            </div>
            {query ? (
              <Link
                href="/search"
                className="text-sm font-semibold uppercase tracking-[0.12em] text-brand-primary-900 hover:opacity-80"
              >
                Clear search
              </Link>
            ) : null}
          </div>

          {posts.length ? (
            <div className="mt-8">
              {posts.map((post) => (
                <CategoryBlogCard
                  key={post.id}
                  title={post.title}
                  imageSrc={post.coverImageUrl || undefined}
                  categoryLabel={buildCategoryLabel(post)}
                  publishedLabel={formatPublishedLabel(post)}
                  href={`/deal/${post.slug}`}
                />
              ))}
            </div>
          ) : (
            <div className="mt-8 rounded-lg border border-dashed border-border bg-muted/40 px-6 py-12 text-center">
              <p className="text-xl font-black text-secondary">No stories matched that search.</p>
              <p className="mt-2 text-sm text-secondary/70">
                Try a broader keyword like a product type, brand, or category.
              </p>
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}

