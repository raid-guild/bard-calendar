import { z } from "zod";
import {
  bundleRunStatuses,
  contentAssetStatuses,
} from "@/lib/bundles/constants";

const optionalText = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((value) => (value ? value : null));

const optionalUrl = optionalText.refine(
  (value) => !value || z.string().url().safeParse(value).success,
  "Must be a valid URL.",
);

const auditCheckSchema = z.object({
  key: z.string().trim().min(1),
  label: z.string().trim().min(1),
  status: z.enum(["pass", "warning", "fail", "not_checked"]),
  evidence: optionalText,
});

export const createBundleRunSchema = z.object({
  source: z.object({
    system: z.literal("portal-post").default("portal-post"),
    id: z.string().trim().min(1, "Portal post ID is required."),
    url: optionalUrl,
  }),
  channels: z
    .array(z.string().trim().min(1))
    .min(1, "Select at least one channel.")
    .transform((channels) => Array.from(new Set(channels))),
  options: z
    .object({
      audit: z.boolean().default(true),
      generate_images: z.boolean().default(true),
    })
    .default({ audit: true, generate_images: true }),
  instructions: optionalText,
});

export const updateBundleRunSchema = z.object({
  status: z.enum(bundleRunStatuses).optional(),
  stage: z.string().trim().min(1).optional(),
  source_revision: optionalText,
  prism_request_id: optionalText,
  audit_checks: z.array(auditCheckSchema).optional(),
  error_message: optionalText,
  started_at: z.string().datetime({ offset: true }).optional().nullable(),
  finished_at: z.string().datetime({ offset: true }).optional().nullable(),
});

export const upsertContentAssetSchema = z.object({
  topic_id: z.string().trim().min(1),
  draft_id: optionalText,
  kind: z.string().trim().min(1),
  status: z.enum(contentAssetStatuses).default("generated"),
  target_channel: optionalText,
  prism_request_id: z.string().trim().min(1),
  prism_artifact_id: z.string().trim().min(1),
  stable_url: optionalUrl,
  mime_type: optionalText,
  prompt: optionalText,
  metadata: z.record(z.unknown()).optional().default({}),
});

export type CreateBundleRunInput = z.infer<typeof createBundleRunSchema>;
export type UpdateBundleRunInput = z.infer<typeof updateBundleRunSchema>;
export type UpsertContentAssetInput = z.infer<typeof upsertContentAssetSchema>;
