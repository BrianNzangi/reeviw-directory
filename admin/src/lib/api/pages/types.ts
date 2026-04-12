export type Page = {
  id: string;
  title: string;
  slug: string;
  content?: string | null;
  coverImageUrl?: string | null;
  status: "draft" | "published";
  updatedAt?: string;
  publishedAt?: string | null;
};
