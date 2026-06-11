import { z } from "zod";
import { publishingStatuses } from "@/lib/events/constants";

const optionalUrl = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((value) => (value ? value : null))
  .refine((value) => !value || z.string().url().safeParse(value).success, {
    message: "Must be a valid URL.",
  });

const optionalText = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((value) => (value ? value : null));

const metadataSchema = z.record(z.unknown()).default({});

export const eventCreateSchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  publish_at: z.string().datetime({ offset: true }),
  target_channel: z.string().trim().min(1, "Target channel is required."),
  status: z.enum(publishingStatuses).default("planned"),
  content_type: optionalText,
  campaign: optionalText,
  owner: optionalText,
  draft_url: optionalUrl,
  media_url: optionalUrl,
  live_url: optionalUrl,
  notes: optionalText,
  metadata: metadataSchema.optional().default({}),
  external_source: optionalText,
  external_id: optionalText,
});

export const eventUpdateSchema = eventCreateSchema.partial().extend({
  metadata: metadataSchema.optional(),
});

export const eventListQuerySchema = z.object({
  start: z.string().datetime({ offset: true }).optional(),
  end: z.string().datetime({ offset: true }).optional(),
  target_channel: z.string().trim().optional(),
  status: z.enum(publishingStatuses).optional(),
  owner: z.string().trim().optional(),
  name: z.string().trim().optional(),
  search: z.string().trim().optional(),
});

export const agentCreateSchema = eventCreateSchema;

export const agentUpsertSchema = eventCreateSchema
  .omit({ external_source: true, external_id: true })
  .extend({
    external_source: z.string().trim().min(1, "external_source is required."),
    external_id: z.string().trim().min(1, "external_id is required."),
  });

export type EventCreateInput = z.infer<typeof eventCreateSchema>;
export type EventUpdateInput = z.infer<typeof eventUpdateSchema>;
export type EventListQuery = z.infer<typeof eventListQuerySchema>;
export type AgentUpsertInput = z.infer<typeof agentUpsertSchema>;
