import type {
  DealPageData,
  PostCategory,
  PostDetail,
  ProductDetailResponse,
  ProductOfferResponse,
  SuggestedItem,
  SuggestedPost,
} from "@/types/deal";

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

export function getPublishedLabel(post: PostDetail) {
  const raw = post.publishedAt || post.createdAt || post.updatedAt;
  if (!raw) return "Published recently";
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return "Published recently";
  return `Updated ${parsed.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`;
}

export function buildCategoryLabel(post: PostDetail) {
  const linkedCategories = post.categories ?? [];
  if (!linkedCategories.length) return "DEAL BLOG";

  const byId = new Map(linkedCategories.map((item) => [item.id, item]));
  const leaf =
    linkedCategories.find((item) => normalizeSlug(item.slug) === normalizeSlug(post.postType))
    || linkedCategories[0];

  if (!leaf.parentId) return leaf.name.toUpperCase();
  const parent = byId.get(leaf.parentId);
  return `${(parent?.name || leaf.name).toUpperCase()} > ${leaf.name.toUpperCase()}`;
}

function getText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export function normalizeSuggested(items: Array<SuggestedItem | string> | null | undefined) {
  if (!items?.length) return [] as SuggestedPost[];

  const seen = new Set<string>();
  const normalized: SuggestedPost[] = [];

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    if (typeof item === "string") continue;
    const nested = item?.post;
    const title = getText(item?.title) || getText(nested?.title);
    const slug = getText(item?.slug) || getText(nested?.slug);
    if (!title || !slug) continue;
    const id =
      getText(item?.id)
      || getText(item?.postId)
      || getText(nested?.id)
      || slug
      || `suggested-${index}`;

    if (seen.has(id)) continue;
    seen.add(id);
    normalized.push({ id, title, slug });
  }

  return normalized;
}

async function getDealPost(baseUrl: string, slug: string) {
  try {
    const response = await fetch(`${baseUrl}/api/posts/${encodeURIComponent(slug)}`, {
      cache: "no-store",
    });
    if (!response.ok) return null;

    const data = (await response.json()) as PostDetail;
    return {
      ...data,
      coverImageUrl: toAbsoluteImageUrl(data.coverImageUrl, baseUrl) ?? null,
    };
  } catch {
    return null;
  }
}

async function getAttachedProductOffer(baseUrl: string, productSlug: string) {
  try {
    const response = await fetch(`${baseUrl}/api/products/${encodeURIComponent(productSlug)}`, {
      cache: "no-store",
    });
    if (!response.ok) return null;

    const data = (await response.json()) as ProductDetailResponse;
    const offers = Array.isArray(data.offers) ? data.offers : [];
    const candidates = offers.filter((offer: ProductOfferResponse) => typeof offer.offerUrl === "string" && offer.offerUrl.trim());
    if (!candidates.length) return null;

    const preferred = candidates.find((offer) => offer.isPrimary) || candidates[0];
    const url = preferred.offerUrl?.trim();
    if (!url) return null;

    return {
      offerUrl: url,
      merchantName: preferred.merchant?.name?.trim() || undefined,
    };
  } catch {
    return null;
  }
}

async function getCategories(baseUrl: string) {
  try {
    const response = await fetch(`${baseUrl}/api/categories`, { cache: "no-store" });
    if (!response.ok) return [] as PostCategory[];
    const data = (await response.json()) as PostCategory[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [] as PostCategory[];
  }
}

function getRelatedParentScope(post: PostDetail, allCategories: PostCategory[]) {
  const linkedCategories = post.categories ?? [];
  if (!linkedCategories.length) {
    return { categoryIds: [] as string[], parentCategoryName: "Related Deals" };
  }

  const byId = new Map(allCategories.map((item) => [item.id, item]));
  const leaf =
    linkedCategories.find((item) => normalizeSlug(item.slug) === normalizeSlug(post.postType))
    || linkedCategories[0];
  const resolvedLeaf = byId.get(leaf.id) || leaf;
  const parentId = resolvedLeaf.parentId || resolvedLeaf.id;
  const parent = byId.get(parentId) || resolvedLeaf;
  const childIds = allCategories.filter((item) => item.parentId === parentId).map((item) => item.id);
  const categoryIds = Array.from(new Set([parentId, ...childIds]));

  return {
    categoryIds,
    parentCategoryName: parent.name || "Related Deals",
  };
}

export async function getDealPageData(slug: string): Promise<DealPageData | null> {
  const rawBaseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL
    || process.env.NEXT_PUBLIC_BACKEND_URL
    || "http://localhost:3002";
  const baseUrl = rawBaseUrl.replace(/\/$/, "");
  const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const siteUrl = rawSiteUrl.replace(/\/$/, "");

  const post = await getDealPost(baseUrl, slug);
  if (!post) return null;

  const allCategories = await getCategories(baseUrl);
  const { categoryIds: similarCategoryIds, parentCategoryName } = getRelatedParentScope(post, allCategories);

  const categoryLabel = buildCategoryLabel(post);
  const publishedLabel = getPublishedLabel(post);
  const suggested = normalizeSuggested(post.suggestedReading);
  const primaryProduct = (post.products ?? [])[0];
  const productOfferFallback =
    primaryProduct && !primaryProduct?.primaryOffer?.offerUrl
      ? await getAttachedProductOffer(baseUrl, primaryProduct.slug)
      : null;
  const primaryOfferUrl =
    primaryProduct?.primaryOffer?.offerUrl
    || productOfferFallback?.offerUrl
    || undefined;
  const primaryMerchantName =
    primaryProduct?.primaryOffer?.merchant?.name
    || productOfferFallback?.merchantName
    || "Merchant";
  const dealUrl = `${siteUrl}/deal/${post.slug}`;
  const shareUrl = encodeURIComponent(dealUrl);
  const shareTitle = encodeURIComponent(post.title);

  return {
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
  };
}
