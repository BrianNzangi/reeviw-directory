import { Container } from "@/components/container";
import { Horizontal1AdSlot } from "@/components/ads/horizontal1-ad-slot";
import { FeaturedBlogCard, TextBlogCard } from "@/components/shared/blog-cards";

type HeroPost = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  coverImageUrl?: string | null;
  isFeatured?: boolean;
  latestDeal?: boolean;
};

function toAbsoluteImageUrl(rawUrl: string | null | undefined, baseUrl: string) {
  const value = rawUrl?.trim();
  if (!value) return undefined;

  if (value.startsWith("data:image/")) return value;
  if (value.startsWith("//")) return `https:${value}`;

  try {
    return new URL(value).toString();
  } catch {
    // Relative media paths from backend should resolve against API base URL.
    if (value.startsWith("/")) return `${baseUrl}${value}`;
    return `${baseUrl}/${value.replace(/^\.?\//, "")}`;
  }
}

async function isReachableImage(url: string) {
  try {
    const response = await fetch(url, { method: "HEAD", cache: "no-store" });
    return response.ok || response.status === 405;
  } catch {
    return false;
  }
}

async function getHeroPosts(
  baseUrl: string,
  filters: { isFeatured?: boolean; latestDeal?: boolean },
) {
  const params = new URLSearchParams();
  if (typeof filters.isFeatured === "boolean") params.set("isFeatured", String(filters.isFeatured));
  if (typeof filters.latestDeal === "boolean") params.set("latestDeal", String(filters.latestDeal));

  try {
    const response = await fetch(`${baseUrl}/api/posts?${params.toString()}`, {
      cache: "no-store",
    });
    if (!response.ok) return [];
    const data = (await response.json()) as { items?: HeroPost[] } | HeroPost[];
    const items = Array.isArray(data) ? data : data.items ?? [];
    let normalized = items.map((post) => ({
      ...post,
      coverImageUrl: toAbsoluteImageUrl(post.coverImageUrl, baseUrl) ?? null,
    }));
    if (typeof filters.isFeatured === "boolean") {
      normalized = normalized.filter((post) => Boolean(post.isFeatured) === filters.isFeatured);
    }
    if (typeof filters.latestDeal === "boolean") {
      normalized = normalized.filter((post) => Boolean(post.latestDeal) === filters.latestDeal);
    }
    return normalized;
  } catch {
    return [];
  }
}

async function getHeroData() {
  const rawBaseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL
    || process.env.NEXT_PUBLIC_BACKEND_URL
    || "http://localhost:3002";
  const baseUrl = rawBaseUrl.replace(/\/$/, "");

  try {
    const [featuredPosts, latestDeals] = await Promise.all([
      getHeroPosts(baseUrl, { isFeatured: true }),
      getHeroPosts(baseUrl, { latestDeal: true }),
    ]);
    const [featuredDeal] = featuredPosts;

    // Prevent broken hero image by dropping unreachable sources.
    if (featuredDeal?.coverImageUrl && !featuredDeal.coverImageUrl.startsWith("data:image/")) {
      const reachable = await isReachableImage(featuredDeal.coverImageUrl);
      if (!reachable) {
        featuredPosts[0] = { ...featuredDeal, coverImageUrl: null };
      }
    }

    return { featuredPosts, latestDeals };
  } catch {
    return { featuredPosts: [], latestDeals: [] };
  }
}

export async function Hero() {
  const { featuredPosts, latestDeals } = await getHeroData();
  const [featuredDeal] = featuredPosts;
  const featuredIds = new Set(featuredPosts.map((post) => post.id));
  const latestDealsOnly = latestDeals.filter((post) => !featuredIds.has(post.id));

  return (
    <section className="py-6 sm:py-8">
      <Container>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <FeaturedBlogCard
            title={featuredDeal?.title || "Featured deals coming soon"}
            excerpt={featuredDeal?.excerpt || "Mark a post as Featured in admin to show it here."}
            imageAlt={featuredDeal?.title || "Featured deals"}
            imageSrc={featuredDeal?.coverImageUrl || undefined}
            href={featuredDeal?.slug ? `/deal/${featuredDeal.slug}` : undefined}
          />

          <aside>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-black text-brand-primary-900">Latest Deals</h2>
            </div>

            <div className="space-y-3">
              {latestDealsOnly.length ? (
                latestDealsOnly.slice(0, 6).map((deal) => (
                  <TextBlogCard key={deal.id} title={deal.title} href={`/deal/${deal.slug}`} />
                ))
              ) : (
                <p className="py-2 text-sm text-muted-foreground">No latest deals yet.</p>
              )}
            </div>
          </aside>
        </div>
      </Container>
      <Container className="pt-4 pb-2 sm:pt-6 sm:pb-4">
        <Horizontal1AdSlot className="w-full" />
      </Container>
    </section>
  );
}

