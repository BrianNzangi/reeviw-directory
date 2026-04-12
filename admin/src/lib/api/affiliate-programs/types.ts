export type AffiliateProgram = {
  id: string;
  network: "awin" | "amazon" | "cj" | "impact" | "manual" | "partnerstack";
  name: string;
  apiProgramId: string;
  merchantId?: string | null;
  merchantName?: string | null;
  feedFormat?: "zip_csv" | "csv" | "xml" | "json";
  syncFrequencyHours?: number;
  lastSyncedAt?: string | null;
  isActive?: boolean;
  feedUrlMasked?: string | null;
  feedUrlSet?: boolean;
};
