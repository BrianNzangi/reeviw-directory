export type PostCategory = {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
  homepagePlacement?: "catalog" | "home_collection" | null;
};

export type PostTag = {
  id: string;
  name: string;
};

export type PostProduct = {
  id: string;
  name: string;
  sortOrder?: number;
  markdown?: string | null;
};

export type Post = {
  id: string;
  title: string;
  slug: string;
  postType: string;
  postKind?: "standard" | "single_deal";
  status: "draft" | "published";
  updatedAt?: string;
  publishedAt?: string | null;
  excerpt?: string | null;
  content?: string | null;
  conclusionHtml?: string | null;
  suggestedReading?: Array<{ id: string; title: string; slug?: string }> | null;
  coverImageUrl?: string | null;
  isFeatured?: boolean;
  latestDeal?: boolean;
  sponsored?: boolean;
  categories?: PostCategory[];
};
