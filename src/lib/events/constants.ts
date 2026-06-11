export const publishingStatuses = [
  "idea",
  "planned",
  "drafting",
  "ready",
  "scheduled",
  "published",
  "skipped",
] as const;

export type PublishingStatus = (typeof publishingStatuses)[number];

export const targetChannels = [
  "discord",
  "x",
  "linkedin",
  "mirror",
  "paragraph",
  "farcaster",
  "newsletter",
  "website",
  "other",
] as const;

export const statusColors: Record<PublishingStatus, string> = {
  idea: "hsl(220 10% 50%)",
  planned: "hsl(160 63% 50%)",
  drafting: "hsl(44 92% 58%)",
  ready: "hsl(188 78% 52%)",
  scheduled: "hsl(263 76% 66%)",
  published: "hsl(145 72% 42%)",
  skipped: "hsl(347 100% 61%)",
};
