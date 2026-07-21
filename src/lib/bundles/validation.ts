import { z } from "zod";
import {
  bundleRunStatuses,
  contentAssetStatuses,
} from "@/lib/bundles/constants";

const nullableText = z
  .string()
  .trim()
  .nullable()
  .transform((value) => (value ? value : null));

const optionalNullableText = nullableText.optional();
const defaultNullText = optionalNullableText.transform((value) => value ?? null);

const nullableUrl = nullableText.refine(
  (value) => !value || z.string().url().safeParse(value).success,
  "Must be a valid URL.",
);
const optionalNullableUrl = nullableUrl.optional();
const defaultNullUrl = optionalNullableUrl.transform((value) => value ?? null);

const auditCheckSchema = z.object({
  key: z.string().trim().min(1),
  label: z.string().trim().min(1),
  status: z.enum(["pass", "warning", "fail", "not_checked"]),
  evidence: defaultNullText,
});

export const createBundleRunSchema = z.object({
  source: z.object({
    system: z.literal("portal-post").default("portal-post"),
    id: z.string().trim().min(1, "Portal post ID is required."),
    url: defaultNullUrl,
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
  instructions: defaultNullText,
});

export const updateBundleRunSchema = z.object({
  status: z.enum(bundleRunStatuses).optional(),
  stage: z.string().trim().min(1).optional(),
  source_revision: optionalNullableText,
  prism_request_id: optionalNullableText,
  audit_checks: z.array(auditCheckSchema).optional(),
  error_message: optionalNullableText,
  started_at: z.string().datetime({ offset: true }).optional().nullable(),
  finished_at: z.string().datetime({ offset: true }).optional().nullable(),
});

export const upsertContentAssetSchema = z.object({
  topic_id: z.string().trim().min(1),
  draft_id: optionalNullableText,
  kind: z.string().trim().min(1),
  status: z.enum(contentAssetStatuses).default("generated"),
  target_channel: optionalNullableText,
  prism_request_id: z.string().trim().min(1),
  prism_artifact_id: z.string().trim().min(1),
  stable_url: optionalNullableUrl,
  mime_type: optionalNullableText,
  prompt: optionalNullableText,
  metadata: z.record(z.unknown()).optional(),
});

export type CreateBundleRunInput = z.infer<typeof createBundleRunSchema>;
export type UpdateBundleRunInput = z.infer<typeof updateBundleRunSchema>;
export type UpsertContentAssetInput = z.infer<typeof upsertContentAssetSchema>;
