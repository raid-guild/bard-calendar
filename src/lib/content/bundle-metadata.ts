import type { ContentDraft, ContentTopic } from "@/lib/content/types";

export type BundleSource = {
  id: string | null;
  url: string | null;
  updatedAt: string | null;
  revision: string | null;
};

export type BundleRun = {
  requestId: string | null;
  status: string;
  stage: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  error: string | null;
};

export type AuditCheck = {
  key: string;
  label: string;
  status: "pass" | "warning" | "fail" | "not_checked";
  evidence: string | null;
};

export type BundleAsset = {
  artifactId: string;
  kind: string;
  targetChannel: string | null;
  mimeType: string | null;
  url: string | null;
  draftId: string | null;
};

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function text(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function identifier(value: unknown) {
  return typeof value === "number" && Number.isFinite(value)
    ? String(value)
    : text(value);
}

function auditStatus(value: unknown): AuditCheck["status"] {
  return value === "pass" ||
    value === "warning" ||
    value === "fail" ||
    value === "not_checked"
    ? value
    : "not_checked";
}

export function bundleSource(topic: ContentTopic): BundleSource {
  const metadata = record(topic.metadata);

  return {
    id:
      identifier(metadata.portal_post_id) ??
      (topic.external_source === "portal-post" ? topic.external_id : null),
    url: text(metadata.portal_post_url),
    updatedAt: text(metadata.portal_updated_at),
    revision: text(metadata.source_revision),
  };
}

export function latestBundleRun(topic: ContentTopic): BundleRun | null {
  const metadata = record(topic.metadata);
  const run = record(metadata.latest_bundle_run);
  const requestId =
    text(run.prism_request_id) ?? text(metadata.latest_prism_request_id);
  const status = text(run.status);

  if (!requestId && !status) {
    return null;
  }

  return {
    requestId,
    status: status ?? "unknown",
    stage: text(run.stage),
    startedAt: text(run.started_at),
    finishedAt: text(run.finished_at),
    error: text(run.error_message),
  };
}

export function bundleAuditChecks(topic: ContentTopic): AuditCheck[] {
  const metadata = record(topic.metadata);
  const values = Array.isArray(metadata.audit_checks)
    ? metadata.audit_checks
    : [];

  return values.flatMap((value, index) => {
    const check = record(value);
    const label = text(check.label);

    if (!label) {
      return [];
    }

    return [
      {
        key: text(check.key) ?? `check-${index}`,
        label,
        status: auditStatus(check.status),
        evidence: text(check.evidence),
      },
    ];
  });
}

function assetsFromMetadata(
  metadataValue: unknown,
  draftId: string | null,
): BundleAsset[] {
  const metadata = record(metadataValue);
  const values = Array.isArray(metadata.assets) ? metadata.assets : [];

  return values.flatMap((value) => {
    const asset = record(value);
    const artifactId = text(asset.artifact_id);

    if (!artifactId) {
      return [];
    }

    return [
      {
        artifactId,
        kind: text(asset.kind) ?? "asset",
        targetChannel: text(asset.target_channel) ?? text(asset.variant),
        mimeType: text(asset.mime_type),
        url: text(asset.url),
        draftId,
      },
    ];
  });
}

export function bundleAssets(
  topic: ContentTopic,
  drafts: ContentDraft[],
): BundleAsset[] {
  const assets = [
    ...assetsFromMetadata(topic.metadata, null),
    ...drafts.flatMap((draft) =>
      assetsFromMetadata(draft.metadata, draft.id),
    ),
  ];

  return Array.from(
    new Map(assets.map((asset) => [asset.artifactId, asset])).values(),
  );
}
