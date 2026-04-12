export type ManagedPageData = {
  id: string;
  title: string;
  slug: string;
  content?: string | null;
  coverImageUrl?: string | null;
  updatedAt?: string;
  publishedAt?: string | null;
};

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

export async function getManagedPageData(slug: string): Promise<ManagedPageData | null> {
  const rawBaseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL
    || process.env.NEXT_PUBLIC_BACKEND_URL
    || "http://localhost:3002";
  const baseUrl = rawBaseUrl.replace(/\/$/, "");

  try {
    const response = await fetch(`${baseUrl}/api/posts/${encodeURIComponent(slug)}`, {
      cache: "no-store",
    });
    if (!response.ok) return null;

    const page = (await response.json()) as ManagedPageData;
    return {
      ...page,
      coverImageUrl: toAbsoluteImageUrl(page.coverImageUrl, baseUrl) ?? null,
    };
  } catch {
    return null;
  }
}
