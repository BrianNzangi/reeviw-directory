export type CollectionCategory = {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
  homepagePlacement?: "catalog" | "home_collection" | null;
};

export type CollectionPost = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  coverImageUrl?: string | null;
  postType: string;
  sponsored?: boolean;
  publishedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type ParentCategoryLabelResolver = (post: CollectionPost) => string;
