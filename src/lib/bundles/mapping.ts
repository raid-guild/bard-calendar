import type {
  ContentAssetRow,
  ContentBundleRunRow,
  NewContentAssetRow,
  NewContentBundleRunRow,
} from "@/lib/db/schema";
import type {
  CreateBundleRunInput,
  UpdateBundleRunInput,
  UpsertContentAssetInput,
} from "@/lib/bundles/validation";

export function createBundleRunId() {
  return `run_${crypto.randomUUID()}`;
}

export function createContentAssetId() {
  return `ast_${crypto.randomUUID()}`;
}

export function mapRowToBundleRun(row: ContentBundleRunRow) {
  return {
    id: row.id,
    topic_id: row.topicId,
    status: row.status,
    stage: row.stage,
    source_system: row.sourceSystem,
    source_id: row.sourceId,
    source_url: row.sourceUrl,
    source_revision: row.sourceRevision,
    prism_request_id: row.prismRequestId,
    requested_channels: (row.requestedChannelsJson ?? []) as string[],
    options: (row.optionsJson ?? {}) as Record<string, unknown>,
    audit_checks: (row.auditJson ?? []) as Array<{
      key: string;
      label: string;
      status: "pass" | "warning" | "fail" | "not_checked";
      evidence?: string | null;
    }>,
    instructions: row.instructions,
    error_message: row.errorMessage,
    created_by: row.createdBy,
    started_at: row.startedAt?.toISOString() ?? null,
    finished_at: row.finishedAt?.toISOString() ?? null,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
  };
}

export function mapCreateBundleRunInputToRow(
  topicId: string,
  input: CreateBundleRunInput,
  createdBy?: string | null,
): NewContentBundleRunRow {
  const now = new Date();

  return {
    id: createBundleRunId(),
    topicId,
    status: "queued",
    stage: "queued",
    sourceSystem: input.source.system,
    sourceId: input.source.id,
    sourceUrl: input.source.url,
    requestedChannelsJson: input.channels,
    optionsJson: input.options,
    instructions: input.instructions,
    createdBy,
    createdAt: now,
    updatedAt: now,
  };
}

export function mapUpdateBundleRunInputToRow(input: UpdateBundleRunInput) {
  return {
    ...(input.status !== undefined ? { status: input.status } : {}),
    ...(input.stage !== undefined ? { stage: input.stage } : {}),
    ...(input.source_revision !== undefined
      ? { sourceRevision: input.source_revision }
      : {}),
    ...(input.prism_request_id !== undefined
      ? { prismRequestId: input.prism_request_id }
      : {}),
    ...(input.audit_checks !== undefined ? { auditJson: input.audit_checks } : {}),
    ...(input.error_message !== undefined
      ? { errorMessage: input.error_message }
      : {}),
    ...(input.started_at !== undefined
      ? { startedAt: input.started_at ? new Date(input.started_at) : null }
      : {}),
    ...(input.finished_at !== undefined
      ? { finishedAt: input.finished_at ? new Date(input.finished_at) : null }
      : {}),
    updatedAt: new Date(),
  };
}

export function mapRowToContentAsset(row: ContentAssetRow) {
  return {
    id: row.id,
    topic_id: row.topicId,
    draft_id: row.draftId,
    kind: row.kind,
    status: row.status,
    target_channel: row.targetChannel,
    prism_request_id: row.prismRequestId,
    prism_artifact_id: row.prismArtifactId,
    stable_url: row.stableUrl,
    mime_type: row.mimeType,
    prompt: row.prompt,
    metadata: (row.metadataJson ?? {}) as Record<string, unknown>,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
  };
}

export function mapUpsertContentAssetInputToRow(
  input: UpsertContentAssetInput,
): NewContentAssetRow {
  const now = new Date();

  return {
    id: createContentAssetId(),
    topicId: input.topic_id,
    draftId: input.draft_id,
    kind: input.kind,
    status: input.status,
    targetChannel: input.target_channel,
    prismRequestId: input.prism_request_id,
    prismArtifactId: input.prism_artifact_id,
    stableUrl: input.stable_url,
    mimeType: input.mime_type,
    prompt: input.prompt,
    metadataJson: input.metadata,
    createdAt: now,
    updatedAt: now,
  };
}

export function mapUpsertContentAssetInputToUpdateRow(
  input: UpsertContentAssetInput,
  updatedAt = new Date(),
) {
  return {
    topicId: input.topic_id,
    kind: input.kind,
    status: input.status,
    ...(input.draft_id !== undefined ? { draftId: input.draft_id } : {}),
    ...(input.target_channel !== undefined
      ? { targetChannel: input.target_channel }
      : {}),
    ...(input.stable_url !== undefined ? { stableUrl: input.stable_url } : {}),
    ...(input.mime_type !== undefined ? { mimeType: input.mime_type } : {}),
    ...(input.prompt !== undefined ? { prompt: input.prompt } : {}),
    ...(input.metadata !== undefined ? { metadataJson: input.metadata } : {}),
    updatedAt,
  };
}
