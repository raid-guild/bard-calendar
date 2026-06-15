export const topicStatuses = ["active", "archived"] as const;
export type TopicStatus = (typeof topicStatuses)[number];

export const draftStatuses = ["draft", "ready", "assigned", "published", "archived"] as const;
export type DraftStatus = (typeof draftStatuses)[number];
