export type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  parentId?: string | null;
  homepagePlacement?: "catalog" | "home_collection" | null;
  dealBlogsCount?: number;
};
