import { HorizontalAdSection } from "./horizontal-ad-section";
import { SectionGrid } from "./section-grid";
import { SectionSponsored } from "./section-sponsored";
import { SectionSplit } from "./section-split";
import type { CollectionCategory, CollectionPost } from "./types";

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

function dedupeById(posts: CollectionPost[]) {
  const seen = new Set<string>();
  return posts.filter((post) => {
    if (seen.has(post.id)) return false;
    seen.add(post.id);
    return true;
  });
}

function getPostTimestamp(post: CollectionPost) {
  const raw = post.publishedAt || post.createdAt || post.updatedAt;
  if (!raw) return 0;
  const parsed = Date.parse(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

function sortByLatest(posts: CollectionPost[]) {
  return [...posts].sort((a, b) => getPostTimestamp(b) - getPostTimestamp(a));
}

async function getCategories(baseUrl: string) {
  try {
    const response = await fetch(`${baseUrl}/api/categories`, {
      cache: "no-store",
    });
    if (!response.ok) return [];
    const data = (await response.json()) as CollectionCategory[];
    return data;
  } catch {
    return [];
  }
}

async function getPosts(baseUrl: string, query: Record<string, string | boolean | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined) continue;
    params.set(key, String(value));
  }

  try {
    const response = await fetch(`${baseUrl}/api/posts?${params.toString()}`, {
      cache: "no-store",
    });
    if (!response.ok) return [];
    const data = (await response.json()) as { items?: CollectionPost[] } | CollectionPost[];
    const items = Array.isArray(data) ? data : data.items ?? [];
    return items.map((post) => ({
      ...post,
      coverImageUrl: toAbsoluteImageUrl(post.coverImageUrl, baseUrl) ?? null,
    }));
  } catch {
    return [];
  }
}

async function getPostsForHomeCollectionCategory(
  baseUrl: string,
  category: CollectionCategory | undefined,
  allCategories: CollectionCategory[],
) {
  if (!category) return [];

  const childCategories = allCategories.filter((item) => item.parentId === category.id);
  if (childCategories.length === 0) {
    return getPosts(baseUrl, { type: category.slug });
  }

  const groupedPosts = await Promise.all(
    childCategories.map((child) => getPosts(baseUrl, { type: child.slug })),
  );

  return dedupeById(sortByLatest(groupedPosts.flat()));
}

export async function HomepageCollection() {
  const rawBaseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL
    || process.env.NEXT_PUBLIC_BACKEND_URL
    || "http://localhost:3002";
  const baseUrl = rawBaseUrl.replace(/\/$/, "");

  const allCategories = await getCategories(baseUrl);
  const homeCollectionCategories = allCategories.filter((category) => category.homepagePlacement === "home_collection");
  const sectionCategories = homeCollectionCategories;

  const [section1Category] = sectionCategories;
  const section4Category = sectionCategories[1] ?? section1Category;
  const section5Category = sectionCategories[2] ?? section4Category ?? section1Category;
  const section7Category = sectionCategories[3] ?? section5Category ?? section4Category ?? section1Category;
  const section9Category = sectionCategories[4] ?? section7Category ?? section5Category ?? section4Category ?? section1Category;

  const homeCollectionTypeSlugs = new Set<string>();
  for (const category of sectionCategories) {
    homeCollectionTypeSlugs.add(category.slug);
    for (const child of allCategories.filter((item) => item.parentId === category.id)) {
      homeCollectionTypeSlugs.add(child.slug);
    }
  }

  const categoriesBySlug = new Map(allCategories.map((category) => [category.slug, category]));
  const categoriesById = new Map(allCategories.map((category) => [category.id, category]));

  const getParentCategoryLabel = (post: CollectionPost) => {
    const category = categoriesBySlug.get(post.postType);
    if (!category) return "Uncategorized";
    if (!category.parentId) return category.name;
    return categoriesById.get(category.parentId)?.name || category.name;
  };

  const [section1Posts, section4Posts, section5Posts, section7Posts, section9Posts, sponsoredPosts] = await Promise.all([
    getPostsForHomeCollectionCategory(baseUrl, section1Category, allCategories),
    getPostsForHomeCollectionCategory(baseUrl, section4Category, allCategories),
    getPostsForHomeCollectionCategory(baseUrl, section5Category, allCategories),
    getPostsForHomeCollectionCategory(baseUrl, section7Category, allCategories),
    getPostsForHomeCollectionCategory(baseUrl, section9Category, allCategories),
    getPosts(baseUrl, { sponsored: true }),
  ]);

  const sponsoredInHomeCollection = dedupeById(
    sponsoredPosts.filter((post) => homeCollectionTypeSlugs.size === 0 || homeCollectionTypeSlugs.has(post.postType)),
  );

  return (
    <>
      <SectionSplit
        title={section1Category?.name || "Home Collection"}
        posts={section1Posts}
        getParentCategoryLabel={getParentCategoryLabel}
        showAllHref={section1Category ? `/${section1Category.slug}` : undefined}
      />
      <SectionSponsored posts={sponsoredInHomeCollection} />
      <HorizontalAdSection />
      <SectionSplit
        title={section4Category?.name || section1Category?.name || "More Deals"}
        posts={section4Posts}
        getParentCategoryLabel={getParentCategoryLabel}
        showAllHref={section4Category ? `/${section4Category.slug}` : undefined}
      />
      <SectionGrid
        title={section5Category?.name || "Deals Grid"}
        posts={section5Posts}
        showAllHref={section5Category ? `/${section5Category.slug}` : undefined}
      />
      <HorizontalAdSection />
      <SectionSplit
        title={section7Category?.name || section5Category?.name || "More Stories"}
        posts={section7Posts}
        getParentCategoryLabel={getParentCategoryLabel}
        showAllHref={section7Category ? `/${section7Category.slug}` : undefined}
      />
      <HorizontalAdSection />
      <SectionGrid
        title={section9Category?.name || "More Deals"}
        posts={section9Posts}
        showAllHref={section9Category ? `/${section9Category.slug}` : undefined}
      />
      <HorizontalAdSection />
    </>
  );
}
