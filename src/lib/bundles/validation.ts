import { z } from "zod";
import {
  bundleRunStatuses,
  contentAssetStatuses,
} from "@/lib/bundles/constants";

const terminalBundleRunStatuses = new Set([
  "partial",
  "complete",
  "failed",
  "canceled",
]);

const signedUrlParameterNames = new Set([
  "expires",
  "key-pair-id",
  "policy",
  "se",
  "sig",
  "signature",
  "sp",
  "sv",
  "token",
]);

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

function isApprovedDurableAssetUrl(value: string) {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  const hostname = url.hostname.toLowerCase();
  const approvedHosts = new Set(
    (process.env.BARD_CONTENT_ASSET_DURABLE_HOSTS ?? "")
      .split(",")
      .map((host) => host.trim().toLowerCase())
      .filter(Boolean),
  );

  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    approvedHosts.size === 0 ||
    !approvedHosts.has(hostname)
  ) {
    return false;
  }

  return Array.from(url.searchParams.keys()).every((key) => {
    const normalized = key.toLowerCase();
    return (
      !normalized.startsWith("x-amz-") &&
      !normalized.startsWith("x-goog-") &&
      !signedUrlParameterNames.has(normalized)
    );
  });
}

const stableAssetUrl = optionalNullableUrl.refine(
  (value) => !value || isApprovedDurableAssetUrl(value),
  "Must use an approved durable public asset host without signed URL parameters.",
);

const auditCheckSchema = z.object({
  key: z.string().trim().min(1),
  label: z.string().trim().min(1),
  status: z.enum(["pass", "warning", "fail", "not_checked"]),
  evidence: defaultNullText,
});

export const createBundleRunSchema = z.object({
  idempotency_key: z.string().trim().min(8).max(200).optional(),
  source: z.object({
    system: z.literal("portal-post").default("portal-post"),
    id: z.string().trim().min(1, "Portal post ID is required."),
    url: defaultNullUrl,
  }),
  channels: z
    .array(z.union([z.string().trim().min(1), z.object({ platform: z.string().min(1), account: z.string().nullable().optional(), format: z.string().nullable().optional() })]))
    .min(1, "Select at least one channel.")
    .transform((channels) => Array.from(new Map(channels.map((channel) => [JSON.stringify(channel), channel])).values())),
  options: z
    .object({
      audit: z.boolean().default(true),
      generate_images: z.boolean().default(true),
    })
    .default({ audit: true, generate_images: true }),
  instructions: defaultNullText,
});

export const updateBundleRunSchema = z
  .object({
    status: z.enum(bundleRunStatuses).optional(),
    stage: z.string().trim().min(1).optional(),
    source_revision: optionalNullableText,
    prism_request_id: optionalNullableText,
    audit_checks: z.array(auditCheckSchema).optional(),
    error_message: optionalNullableText,
    started_at: z.string().datetime({ offset: true }).optional().nullable(),
    finished_at: z.string().datetime({ offset: true }).optional().nullable(),
  })
  .superRefine((input, context) => {
    if (input.finished_at === null && input.status === undefined) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["finished_at"],
        message: "Clearing finished_at requires an explicit non-terminal status.",
      });
    }
  })
  .transform((input) =>
    input.status && terminalBundleRunStatuses.has(input.status)
      ? { ...input, finished_at: input.finished_at ?? new Date().toISOString() }
      : input,
  );

export const upsertContentAssetSchema = z.object({
  topic_id: z.string().trim().min(1),
  draft_id: optionalNullableText,
  kind: z.string().trim().min(1),
  status: z.enum(contentAssetStatuses).default("generated"),
  target_channel: optionalNullableText,
  prism_request_id: z.string().trim().min(1),
  prism_artifact_id: z.string().trim().min(1),
  stable_url: stableAssetUrl,
  mime_type: optionalNullableText,
  prompt: optionalNullableText,
  metadata: z.record(z.unknown()).optional(),
});

export type CreateBundleRunInput = z.infer<typeof createBundleRunSchema>;
export type UpdateBundleRunInput = z.infer<typeof updateBundleRunSchema>;
export type UpsertContentAssetInput = z.infer<typeof upsertContentAssetSchema>;
