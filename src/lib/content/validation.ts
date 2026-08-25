import { z } from "zod";
import { draftStatuses, topicStatuses } from "@/lib/content/constants";
import { targetChannels } from "@/lib/events/constants";

const optionalText = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((value) => (value ? value : null));

const optionalUrl = optionalText.refine((value) => !value || z.string().url().safeParse(value).success, {
  message: "Must be a valid URL.",
});

const metadataSchema = z.record(z.unknown()).default({});
const tagsSchema = z.array(z.string().trim().min(1).max(40)).max(20).transform((tags) =>
  Array.from(new Set(tags.map((tag) => tag.toLowerCase()))),
);

export const topicCreateSchema = z.object({
  title: z.string().trim().min(1, "Title is required."),
  supporting_material_markdown: optionalText,
  status: z.enum(topicStatuses).default("active"),
  created_by: optionalText,
  metadata: metadataSchema.optional().default({}),
  category_id: optionalText,
  tags: tagsSchema.optional().default([]),
  editorial_interest_score: z.number().int().min(0).max(100).optional().nullable(),
  engagement_interest_count: z.number().int().min(0).optional().default(0),
  external_source: optionalText,
  external_id: optionalText,
});

export const topicUpdateSchema = topicCreateSchema.partial().extend({
  metadata: metadataSchema.optional(),
});

export const topicListQuerySchema = z.object({
  status: z.enum(topicStatuses).optional(),
  search: z.string().trim().optional(),
  publication_status: z.enum(["unpublished", "published"]).optional(),
  publication_start: z.string().datetime({ offset: true }).optional(),
  publication_end: z.string().datetime({ offset: true }).optional(),
  category_id: z.string().trim().optional(),
  tag: z.string().trim().toLowerCase().optional(),
});

export const topicPublishSchema = z.object({
  publication_at: z.string().datetime({ offset: true }),
  evidence_type: z.enum(["live_url", "external_post_id", "manual_confirmation"]),
  evidence_value: optionalText,
  manual_confirmation: z.boolean().default(false),
  actor: z.string().trim().min(1),
}).superRefine((value, context) => {
  if (value.evidence_type === "manual_confirmation" && !value.manual_confirmation) {
    context.addIssue({ code: "custom", path: ["manual_confirmation"], message: "Manual confirmation must be explicit." });
  }
  if (value.evidence_type !== "manual_confirmation" && !value.evidence_value) {
    context.addIssue({ code: "custom", path: ["evidence_value"], message: "Publication evidence is required." });
  }
  if (value.evidence_type === "live_url" && value.evidence_value && !z.string().url().safeParse(value.evidence_value).success) {
    context.addIssue({ code: "custom", path: ["evidence_value"], message: "Live URL must be valid." });
  }
});

export const topicReopenSchema = z.object({
  reason: z.string().trim().min(1, "A reopen reason is required."),
  actor: z.string().trim().min(1),
});

export const categoryCreateSchema = z.object({
  key: z.string().trim().min(1).max(60).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().trim().min(1).max(100),
  active: z.boolean().default(true),
  sort_order: z.number().int().default(0),
  metadata: metadataSchema.optional().default({}),
});

export const agentTopicUpsertSchema = topicCreateSchema
  .omit({ external_source: true, external_id: true })
  .extend({
    external_source: z.string().trim().min(1, "external_source is required."),
    external_id: z.string().trim().min(1, "external_id is required."),
  });

const channelSchema = z.string().trim().min(1, "Target channel is required.").refine(
  (value) => targetChannels.includes(value as (typeof targetChannels)[number]) || value.length > 0,
  "Target channel is required.",
);

export const draftCreateSchema = z.object({
  topic_id: z.string().trim().min(1, "Topic is required."),
  title: z.string().trim().min(1, "Title is required."),
  target_channel: channelSchema,
  markdown_content: z.string().default(""),
  external_draft_url: optionalUrl,
  status: z.enum(draftStatuses).default("draft"),
  created_by: optionalText,
  metadata: metadataSchema.optional().default({}),
  external_source: optionalText,
  external_id: optionalText,
});

export const draftUpdateSchema = draftCreateSchema.partial().extend({
  metadata: metadataSchema.optional(),
});

export const draftListQuerySchema = z.object({
  topic_id: z.string().trim().optional(),
  target_channel: z.string().trim().optional(),
  status: z.enum(draftStatuses).optional(),
  search: z.string().trim().optional(),
});

export const agentDraftUpsertSchema = draftCreateSchema
  .omit({ external_source: true, external_id: true })
  .extend({
    external_source: z.string().trim().min(1, "external_source is required."),
    external_id: z.string().trim().min(1, "external_id is required."),
  });

export const draftAssignEventSchema = z.object({
  publish_at: z.string().datetime({ offset: true }),
  name: z.string().trim().optional(),
  status: z.enum(["idea", "planned", "drafting", "ready", "scheduled", "published", "skipped"]).default("planned"),
  content_type: optionalText,
  campaign: optionalText,
  owner: optionalText,
  attribution: optionalText,
  publisher_account: optionalText,
  media_url: optionalUrl,
  live_url: optionalUrl,
  notes: optionalText,
  metadata: metadataSchema.optional().default({}),
});

export const draftMarkPublishedSchema = z.object({
  live_url: z.string().trim().url("A valid live URL is required."),
  published_at: z.string().datetime({ offset: true }),
  // Unlike create/update payloads, omitted publication metadata means "keep the
  // linked event's value". Preserve undefined so the service can distinguish
  // omission from an explicit null/empty-string clear.
  attribution: optionalText.optional().transform((value) => value === undefined ? undefined : value),
  publisher_account: optionalText.optional().transform((value) => value === undefined ? undefined : value),
  campaign: optionalText.optional().transform((value) => value === undefined ? undefined : value),
  owner: optionalText.optional().transform((value) => value === undefined ? undefined : value),
  name: optionalText.optional().transform((value) => value === undefined ? undefined : value),
  notes: optionalText.optional().transform((value) => value === undefined ? undefined : value),
});

export type TopicCreateInput = z.infer<typeof topicCreateSchema>;
export type TopicUpdateInput = z.infer<typeof topicUpdateSchema>;
export type TopicListQuery = z.infer<typeof topicListQuerySchema>;
export type TopicPublishInput = z.infer<typeof topicPublishSchema>;
export type TopicReopenInput = z.infer<typeof topicReopenSchema>;
export type CategoryCreateInput = z.infer<typeof categoryCreateSchema>;
export type AgentTopicUpsertInput = z.infer<typeof agentTopicUpsertSchema>;
export type DraftCreateInput = z.infer<typeof draftCreateSchema>;
export type DraftUpdateInput = z.infer<typeof draftUpdateSchema>;
export type DraftListQuery = z.infer<typeof draftListQuerySchema>;
export type AgentDraftUpsertInput = z.infer<typeof agentDraftUpsertSchema>;
export type DraftAssignEventInput = z.infer<typeof draftAssignEventSchema>;
export type DraftMarkPublishedInput = z.infer<typeof draftMarkPublishedSchema>;
