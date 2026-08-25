export const topicStatuses = ["active", "parked", "archived"] as const;
export type TopicStatus = (typeof topicStatuses)[number];

export const draftStatuses = ["draft", "ready", "assigned", "published", "archived"] as const;
export type DraftStatus = (typeof draftStatuses)[number];
export const editorialStatuses = ["draft", "blocked", "ready_for_approval", "approved"] as const;
