export type FeedSyncLog = {
  id: string;
  network: string;
  affiliateProgramId?: string | null;
  status: "running" | "success" | "failed";
  startedAt: string;
  finishedAt?: string | null;
  productsSeen: number;
  productsCreated: number;
  productsUpdated: number;
  productsDisabled: number;
  errorMessage?: string | null;
  errorStack?: string | null;
  metaJson?: any;
};
