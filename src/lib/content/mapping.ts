import type { ContentDraftRow, ContentTopicRow, NewContentDraftRow, NewContentTopicRow } from "@/lib/db/schema";
import type { DraftCreateInput, DraftUpdateInput, TopicCreateInput, TopicUpdateInput } from "@/lib/content/validation";
import { routeFromLegacy } from "@/lib/content/routing";

export function createTopicId() {
  return `top_${crypto.randomUUID()}`;
}

export function createDraftId() {
  return `drf_${crypto.randomUUID()}`;
}

export function mapRowToTopic(row: ContentTopicRow, draftCount = 0) {
  return {
    id: row.id,
    title: row.title,
    supporting_material_markdown: row.supportingMaterialMarkdown,
    status: row.status,
    owner: row.owner,
    priority: row.priority,
    parked_reason: row.parkedReason,
    revisit_at: row.revisitAt?.toISOString() ?? null,
    created_by: row.createdBy,
    metadata: (row.metadataJson ?? {}) as Record<string, unknown>,
    external_source: row.externalSource,
    external_id: row.externalId,
    draft_count: draftCount,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
  };
}

export function mapCreateTopicInputToRow(input: TopicCreateInput): NewContentTopicRow {
  const now = new Date();

  return {
    id: createTopicId(),
    title: input.title,
    supportingMaterialMarkdown: input.supporting_material_markdown,
    status: input.status,
    owner: input.owner,
    priority: input.priority,
    parkedReason: input.parked_reason,
    revisitAt: input.revisit_at ? new Date(input.revisit_at) : null,
    createdBy: input.created_by,
    metadataJson: input.metadata ?? {},
    externalSource: input.external_source,
    externalId: input.external_id,
    createdAt: now,
    updatedAt: now,
  };
}

export function mapUpdateTopicInputToRow(input: TopicUpdateInput) {
  return {
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.supporting_material_markdown !== undefined
      ? { supportingMaterialMarkdown: input.supporting_material_markdown }
      : {}),
    ...(input.status !== undefined ? { status: input.status } : {}),
    ...(input.owner !== undefined ? { owner: input.owner } : {}),
    ...(input.priority !== undefined ? { priority: input.priority } : {}),
    ...(input.parked_reason !== undefined ? { parkedReason: input.parked_reason } : {}),
    ...(input.revisit_at !== undefined ? { revisitAt: input.revisit_at ? new Date(input.revisit_at) : null } : {}),
    ...(input.created_by !== undefined ? { createdBy: input.created_by } : {}),
    ...(input.metadata !== undefined ? { metadataJson: input.metadata } : {}),
    ...(input.external_source !== undefined ? { externalSource: input.external_source } : {}),
    ...(input.external_id !== undefined ? { externalId: input.external_id } : {}),
    updatedAt: new Date(),
  };
}

export function mapRowToDraft(
  row: ContentDraftRow,
  daggerCount = 0,
  userHasDagger = false,
  assignedEvent: { id: string; publishAt: Date; liveUrl: string | null } | null = null,
) {
  return {
    id: row.id,
    topic_id: row.topicId,
    title: row.title,
    target_channel: row.targetChannel,
    route: row.routePlatform ? { platform: row.routePlatform, account: row.routeAccount, format: row.routeFormat } : routeFromLegacy(row.targetChannel),
    markdown_content: row.markdownContent,
    external_draft_url: row.externalDraftUrl,
    status: row.status,
    editorial_status: row.editorialStatus,
    approved_at: row.approvedAt?.toISOString() ?? null,
    approved_by: row.approvedBy,
    audit_checks: row.auditJson as unknown[],
    created_by: row.createdBy,
    metadata: (row.metadataJson ?? {}) as Record<string, unknown>,
    external_source: row.externalSource,
    external_id: row.externalId,
    dagger_count: daggerCount,
    user_has_dagger: userHasDagger,
    assigned_event_id: assignedEvent?.id ?? null,
    assigned_publish_at: assignedEvent?.publishAt.toISOString() ?? null,
    live_url: assignedEvent?.liveUrl ?? null,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
  };
}

export function mapCreateDraftInputToRow(input: DraftCreateInput): NewContentDraftRow {
  const now = new Date();

  return {
    id: createDraftId(),
    topicId: input.topic_id,
    title: input.title,
    targetChannel: input.target_channel,
    routePlatform: input.route?.platform ?? routeFromLegacy(input.target_channel)?.platform,
    routeAccount: input.route?.account ?? routeFromLegacy(input.target_channel)?.account,
    routeFormat: input.route?.format ?? routeFromLegacy(input.target_channel)?.format,
    markdownContent: input.markdown_content,
    externalDraftUrl: input.external_draft_url,
    status: input.status,
    editorialStatus: input.editorial_status,
    approvedAt: input.editorial_status === "approved" ? now : null,
    approvedBy: input.approved_by,
    auditJson: input.audit_checks,
    createdBy: input.created_by,
    metadataJson: input.metadata ?? {},
    externalSource: input.external_source,
    externalId: input.external_id,
    createdAt: now,
    updatedAt: now,
  };
}

export function mapUpdateDraftInputToRow(input: DraftUpdateInput) {
  return {
    ...(input.topic_id !== undefined ? { topicId: input.topic_id } : {}),
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.target_channel !== undefined ? { targetChannel: input.target_channel } : {}),
    ...(input.route !== undefined ? { routePlatform: input.route.platform, routeAccount: input.route.account, routeFormat: input.route.format } : {}),
    ...(input.markdown_content !== undefined ? { markdownContent: input.markdown_content } : {}),
    ...(input.external_draft_url !== undefined ? { externalDraftUrl: input.external_draft_url } : {}),
    ...(input.status !== undefined ? { status: input.status } : {}),
    ...(input.editorial_status !== undefined ? { editorialStatus: input.editorial_status, approvedAt: input.editorial_status === "approved" ? new Date() : null, approvedBy: input.editorial_status === "approved" ? input.approved_by : null } : {}),
    ...(input.audit_checks !== undefined ? { auditJson: input.audit_checks } : {}),
    ...(input.created_by !== undefined ? { createdBy: input.created_by } : {}),
    ...(input.metadata !== undefined ? { metadataJson: input.metadata } : {}),
    ...(input.external_source !== undefined ? { externalSource: input.external_source } : {}),
    ...(input.external_id !== undefined ? { externalId: input.external_id } : {}),
    updatedAt: new Date(),
  };
}
