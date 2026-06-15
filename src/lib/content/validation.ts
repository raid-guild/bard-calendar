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

export const topicCreateSchema = z.object({
  title: z.string().trim().min(1, "Title is required."),
  supporting_material_markdown: optionalText,
  status: z.enum(topicStatuses).default("active"),
  created_by: optionalText,
  metadata: metadataSchema.optional().default({}),
  external_source: optionalText,
  external_id: optionalText,
});

export const topicUpdateSchema = topicCreateSchema.partial().extend({
  metadata: metadataSchema.optional(),
});

export const topicListQuerySchema = z.object({
  status: z.enum(topicStatuses).optional(),
  search: z.string().trim().optional(),
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
  media_url: optionalUrl,
  live_url: optionalUrl,
  notes: optionalText,
  metadata: metadataSchema.optional().default({}),
});

export type TopicCreateInput = z.infer<typeof topicCreateSchema>;
export type TopicUpdateInput = z.infer<typeof topicUpdateSchema>;
export type TopicListQuery = z.infer<typeof topicListQuerySchema>;
export type AgentTopicUpsertInput = z.infer<typeof agentTopicUpsertSchema>;
export type DraftCreateInput = z.infer<typeof draftCreateSchema>;
export type DraftUpdateInput = z.infer<typeof draftUpdateSchema>;
export type DraftListQuery = z.infer<typeof draftListQuerySchema>;
export type AgentDraftUpsertInput = z.infer<typeof agentDraftUpsertSchema>;
export type DraftAssignEventInput = z.infer<typeof draftAssignEventSchema>;
