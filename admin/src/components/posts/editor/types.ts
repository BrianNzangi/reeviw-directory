export type PostKind = "standard" | "single_deal";
export type ProductStatusFilter = "__all__" | "draft" | "published";

export type CategoryItem = {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
};

export type SuggestedReadingItem = { id: string; title: string; slug?: string };

export type SelectedProduct = {
  productId: string;
  sortOrder: number;
  markdown: string;
  productName?: string;
};

export type AvailableProduct = {
  id: string;
  name: string;
  slug?: string;
  status?: "draft" | "published";
  websiteUrl?: string | null;
  primaryOffer?: { offerUrl?: string | null } | null;
  description?: string | null;
  imageUrl?: string | null;
};
