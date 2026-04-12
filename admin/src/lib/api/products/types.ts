export type OfferMerchant = {
  id: string;
  name: string;
  slug: string;
  websiteUrl?: string | null;
  affiliateIdentifier?: string | null;
  logoUrl?: string | null;
  status?: "active" | "disabled";
  source?: "manual" | "awin" | "amazon" | "other";
};

export type Offer = {
  id: string;
  productId: string;
  merchantId: string;
  affiliateProgramId?: string | null;
  externalId?: string;
  feedCategory?: string | null;
  offerUrl: string;
  price?: string | null;
  wasPrice?: string | null;
  coupon?: string | null;
  dealText?: string | null;
  availability?: string | null;
  rating?: string | null;
  reviewCount?: number | null;
  extraImages?: string[] | null;
  lastSeenAt?: string | null;
  isActive?: boolean;
  source?: "manual" | "awin_feed" | "amazon_worker" | "amazon_csv";
  isPrimary: boolean;
  createdAt?: string;
  merchant?: OfferMerchant | null;
};

export type ProductTag = { id: string; name: string; slug?: string };

export type ProductCategory = {
  id: string;
  name: string;
  slug?: string;
  parentId?: string | null;
  homepagePlacement?: "catalog" | "home_collection" | null;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  status: "draft" | "published";
  websiteUrl?: string | null;
  imageUrl?: string | null;
  updatedAt?: string;
  primaryOffer?: Offer | null;
  offers?: Offer[];
  tags?: ProductTag[];
  categories?: ProductCategory[];
};
