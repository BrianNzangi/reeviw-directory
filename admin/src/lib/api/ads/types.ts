export type AdSlot = {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  width: number;
  height: number;
  sizeLabel: string;
};

export type AdCampaign = {
  id: string;
  title: string;
  provider: "sponsored" | "google_ads" | "mediavine";
  slotId: string;
  slotSlug?: string | null;
  slotName?: string | null;
  slotDescription?: string | null;
  width: number;
  height: number;
  priority: number;
  weight: number;
  isActive: boolean;
  startDate?: string | null;
  endDate?: string | null;
  config?: Record<string, any>;
  createdAt?: string;
};

export type AdAnalytics = {
  since: string;
  days: number;
  totalImpressions: number;
  totalClicks: number;
  ctr: number;
  bySlot: Array<{ slot: string; slotName?: string | null; impressions: number; clicks: number; ctr: number }>;
  byCampaign: Array<{
    id: string;
    title: string;
    provider: string;
    slot: string;
    slotName?: string | null;
    impressions: number;
    clicks: number;
    ctr: number;
  }>;
};
