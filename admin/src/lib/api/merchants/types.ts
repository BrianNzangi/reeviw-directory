export type Merchant = {
  id: string;
  name: string;
  slug: string;
  websiteUrl?: string | null;
  affiliateIdentifier?: string | null;
  logoUrl?: string | null;
  status?: "active" | "disabled";
  source?: "manual" | "awin" | "amazon" | "other";
};

export type MerchantAnalytics = {
  since: string;
  days: number;
  totalClicks: number;
  byMerchant: Array<{ id: string; name: string; clicks: number }>;
  byDay: Array<{ day: string; clicks: number }>;
};
