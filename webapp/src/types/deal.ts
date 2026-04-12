export type PostCategory = {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
};

export type PostProduct = {
  id: string;
  name: string;
  slug: string;
  sortOrder?: number;
  markdown?: string;
  primaryOffer?: {
    id: string;
    offerUrl: string;
    merchant?: {
      id: string;
      name: string;
      slug: string;
    } | null;
  } | null;
};

export type ProductOfferResponse = {
  offerUrl?: string | null;
  isPrimary?: boolean;
  isActive?: boolean;
  merchant?: {
    name?: string | null;
  } | null;
};

export type ProductDetailResponse = {
  offers?: ProductOfferResponse[];
};

export type SuggestedItem = {
  id?: string;
  postId?: string;
  title?: string;
  slug?: string;
  post?: {
    id?: string;
    title?: string;
    slug?: string;
  };
};

export type SuggestedPost = {
  id: string;
  title: string;
  slug: string;
};

export type PostDetail = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  content?: string | null;
  conclusionHtml?: string | null;
  coverImageUrl?: string | null;
  postType: string;
  publishedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  categories?: PostCategory[];
  products?: PostProduct[];
  suggestedReading?: Array<SuggestedItem | string> | null;
};

export type DealPageData = {
  baseUrl: string;
  post: PostDetail;
  categoryLabel: string;
  publishedLabel: string;
  suggested: SuggestedPost[];
  similarCategoryIds: string[];
  parentCategoryName: string;
  primaryOfferUrl?: string;
  primaryMerchantName: string;
  shareUrl: string;
  shareTitle: string;
};
