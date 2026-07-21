export const bundleRunStatuses = [
  "queued",
  "running",
  "partial",
  "complete",
  "failed",
  "canceled",
] as const;

export type BundleRunStatus = (typeof bundleRunStatuses)[number];

export const contentAssetStatuses = [
  "generated",
  "approved",
  "rejected",
  "archived",
] as const;
