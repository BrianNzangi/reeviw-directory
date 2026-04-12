import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SidebarAdSlot } from "@/components/ads/sidebar-ad-slot";
import { Container } from "@/components/container";
import { CategoryBlogCard } from "@/components/shared/blog-cards";

type Category = {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
};

type CategoryPost = {
  id: string;
  title: string;
  slug: string;
  coverImageUrl?: string | null;
  postType: string;
  categories?: Category[];
  publishedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

type PostsResponse =
  | CategoryPost[]
  | {
    page?: number;
    pageSize?: number;
    hasMore?: boolean;
    items?: CategoryPost[];
  };

type CategoryPageProps = {
  params: { slug: string } | Promise<{ slug: string }>;
  searchParams?: { page?: string; filter?: string } | Promise<{ page?: string; filter?: string }>;
};

const PAGE_SIZE = 20;

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

function normalizeSlug(value: string) {
  return value.trim().toLowerCase();
}

function collectDescendants(categories: Category[], parentId: string, seen = new Set<string>()) {
  for (const category of categories) {
    if (category.parentId !== parentId || seen.has(category.id)) continue;
    seen.add(category.id);
    collectDescendants(categories, category.id, seen);
  }
  return seen;
}

function isDescendantOrSelf(candidateId: string, rootId: string, byId: Map<string, Category>) {
  let cursor: string | null | undefined = candidateId;
  const seen = new Set<string>();
  while (cursor && !seen.has(cursor)) {
    if (cursor === rootId) return true;
    seen.add(cursor);
    cursor = byId.get(cursor)?.parentId ?? null;
  }
  return false;
}

function getPathFromRoot(leafId: string, rootId: string, byId: Map<string, Category>) {
  const path: Category[] = [];
  let cursor: string | null | undefined = leafId;
  const seen = new Set<string>();
  while (cursor && !seen.has(cursor)) {
    const category = byId.get(cursor);
    if (!category) break;
    path.push(category);
    if (category.id === rootId) {
      return path.reverse();
    }
    seen.add(cursor);
    cursor = category.parentId ?? null;
  }
  return [];
}

function buildPostCategoryLabel(
  post: CategoryPost,
  pageCategory: Category,
  bySlug: Map<string, Category>,
  byId: Map<string, Category>,
) {
  const linked = (post.categories ?? [])
    .map((item) => byId.get(item.id) || bySlug.get(normalizeSlug(item.slug)) || item)
    .filter((item): item is Category => Boolean(item));

  const inScope = linked.filter((item) => isDescendantOrSelf(item.id, pageCategory.id, byId));

  let selected = inScope[0];
  let selectedPath = selected ? getPathFromRoot(selected.id, pageCategory.id, byId) : [];
  for (const item of inScope.slice(1)) {
    const path = getPathFromRoot(item.id, pageCategory.id, byId);
    if (path.length > selectedPath.length) {
      selected = item;
      selectedPath = path;
    }
  }

  if (selectedPath.length > 0) {
    return selectedPath.map((item) => item.name.toUpperCase()).join(" > ");
  }

  const leaf = bySlug.get(normalizeSlug(post.postType));
  if (!leaf) return "UNCATEGORIZED";
  if (!leaf.parentId) return leaf.name.toUpperCase();
  const parent = byId.get(leaf.parentId);
  return `${(parent?.name || leaf.name).toUpperCase()} > ${leaf.name.toUpperCase()}`;
}

function formatPublishedLabel(post: CategoryPost) {
  const raw = post.publishedAt || post.createdAt || post.updatedAt;
  if (!raw) return "Published recently";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "Published recently";
  return `Published ${date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
}

function buildCategoryPageHref(slug: string, page: number, filter?: string) {
  const params = new URLSearchParams();
  if (page > 1) params.set("page", String(page));
  if (filter && filter !== "all") params.set("filter", filter);
  const query = params.toString();
  return query ? `/${slug}?${query}` : `/${slug}`;
}

async function getCategories(baseUrl: string) {
  try {
    const response = await fetch(`${baseUrl}/api/categories`, { cache: "no-store" });
    if (!response.ok) return [];
    const data = (await response.json()) as Category[];
    return data;
  } catch {
    return [];
  }
}

async function getCategoryPosts(baseUrl: string, categoryIds: string[], page: number) {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("pageSize", String(PAGE_SIZE));
  params.set("categoryIds", categoryIds.join(","));

  try {
    const response = await fetch(`${baseUrl}/api/posts?${params.toString()}`, { cache: "no-store" });
    if (!response.ok) return { items: [] as CategoryPost[], hasMore: false };
    const data = (await response.json()) as PostsResponse;

    if (Array.isArray(data)) {
      return { items: data, hasMore: data.length >= PAGE_SIZE };
    }

    return {
      items: data.items ?? [],
      hasMore: Boolean(data.hasMore),
    };
  } catch {
    return { items: [] as CategoryPost[], hasMore: false };
  }
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const resolvedParams = await Promise.resolve(params);
  const resolvedSearch = await Promise.resolve(searchParams ?? {});
  const slug = normalizeSlug(resolvedParams.slug);

  if (slug === "home") {
    redirect("/");
  }

  const rawBaseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL
    || process.env.NEXT_PUBLIC_BACKEND_URL
    || "http://localhost:3002";
  const baseUrl = rawBaseUrl.replace(/\/$/, "");

  const categories = await getCategories(baseUrl);
  const bySlug = new Map(categories.map((category) => [normalizeSlug(category.slug), category]));
  const byId = new Map(categories.map((category) => [category.id, category]));

  const category = bySlug.get(slug);
  if (!category) notFound();

  const descendantIds = collectDescendants(categories, category.id);
  const descendantCategories = categories.filter((item) => descendantIds.has(item.id));
  const filterableCategories = [category, ...descendantCategories];
  const filterableSlugSet = new Set(filterableCategories.map((item) => normalizeSlug(item.slug)));

  const requestedFilter = resolvedSearch.filter ? normalizeSlug(resolvedSearch.filter) : "all";
  const activeFilter = filterableSlugSet.has(requestedFilter) ? requestedFilter : "all";
  const activeCategory =
    activeFilter === "all"
      ? category
      : filterableCategories.find((item) => normalizeSlug(item.slug) === activeFilter) || category;
  const activeDescendantIds = collectDescendants(categories, activeCategory.id);
  const activeDescendants = categories.filter((item) => activeDescendantIds.has(item.id));
  const activeScopeCategories = activeFilter === "all"
    ? (descendantCategories.length ? descendantCategories : [category])
    : (activeDescendants.length ? [activeCategory, ...activeDescendants] : [activeCategory]);
  const activeScopeCategoryIds = activeScopeCategories.map((item) => item.id);

  const rawPage = Number(resolvedSearch.page || "1");
  const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;

  const { items, hasMore } = await getCategoryPosts(baseUrl, activeScopeCategoryIds, page);
  const normalizedItems = items.map((post) => ({
    ...post,
    coverImageUrl: toAbsoluteImageUrl(post.coverImageUrl, baseUrl) ?? null,
  }));

  return (
    <section className="bg-white py-6 sm:py-10">
      <Container>
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="inline-flex bg-brand-primary-900 px-3 py-1 text-4xl font-black text-white">
            {category.name}
          </h1>
          <p className="mt-6 border-l-2 border-brand-primary-900 pl-3 text-left text-sm text-secondary/85">
            Our stories may include affiliate links; if you buy through our links, we may earn a
            small commission.
          </p>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div>
            {filterableCategories.length > 1 ? (
              <div className="mb-4 flex flex-wrap gap-2">
                <Link
                  href={buildCategoryPageHref(category.slug, 1)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.06em] ${
                    activeFilter === "all"
                      ? "border-primary bg-primary text-white"
                      : "border-border text-secondary hover:border-primary/50"
                  }`}
                >
                  All Deals
                </Link>
                {filterableCategories
                  .filter((item) => normalizeSlug(item.slug) !== normalizeSlug(category.slug))
                  .map((item) => {
                    const normalizedSlug = normalizeSlug(item.slug);
                    const isActive = activeFilter === normalizedSlug;
                    return (
                      <Link
                        key={item.id}
                        href={buildCategoryPageHref(category.slug, 1, normalizedSlug)}
                        className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.06em] ${
                          isActive
                            ? "border-primary bg-primary text-white"
                            : "border-border text-secondary hover:border-primary/50"
                        }`}
                      >
                        {item.name}
                      </Link>
                    );
                  })}
              </div>
            ) : null}

            <div className="px-3 sm:px-6">
              {normalizedItems.length ? (
                normalizedItems.map((post) => (
                  <CategoryBlogCard
                    key={post.id}
                    title={post.title}
                    imageSrc={post.coverImageUrl || undefined}
                    categoryLabel={buildPostCategoryLabel(post, category, bySlug, byId)}
                    publishedLabel={formatPublishedLabel(post)}
                  />
                ))
              ) : (
                <div className="py-10 text-center">
                  <p className="text-base font-semibold text-secondary">
                    No products or deal blogs found in this category yet.
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Add products to deal blogs assigned to {activeCategory.name} to populate this page.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center justify-between gap-3">
              {page > 1 ? (
                <Link
                  href={buildCategoryPageHref(category.slug, page - 1, activeFilter)}
                  className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-secondary hover:border-primary hover:text-primary"
                >
                  Previous
                </Link>
              ) : (
                <span />
              )}

              <span className="text-sm font-semibold text-secondary/80">Page {page}</span>

              {hasMore ? (
                <Link
                  href={buildCategoryPageHref(category.slug, page + 1, activeFilter)}
                  className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-secondary hover:border-primary hover:text-primary"
                >
                  Next
                </Link>
              ) : (
                <span />
              )}
            </div>
          </div>

          <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
            <SidebarAdSlot className="min-h-62.5" />
            <SidebarAdSlot className="min-h-62.5" />
          </aside>
        </div>
      </Container>
    </section>
  );
}

