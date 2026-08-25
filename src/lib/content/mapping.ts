import type { ContentCategoryRow, ContentDraftRow, ContentTopicRow, NewContentDraftRow, NewContentTopicRow } from "@/lib/db/schema";
import type { DraftCreateInput, DraftUpdateInput, TopicCreateInput, TopicUpdateInput } from "@/lib/content/validation";

export function createTopicId() {
  return `top_${crypto.randomUUID()}`;
}

export function createDraftId() {
  return `drf_${crypto.randomUUID()}`;
}

export function mapRowToCategory(row: ContentCategoryRow) {
  return { id: row.id, key: row.key, name: row.name, active: row.active, sort_order: row.sortOrder, metadata: (row.metadataJson ?? {}) as Record<string, unknown> };
}

export function mapRowToTopic(row: ContentTopicRow, draftCount = 0, category: ContentCategoryRow | null = null) {
  return {
    id: row.id,
    title: row.title,
    supporting_material_markdown: row.supportingMaterialMarkdown,
    status: row.status,
    publication_status: row.publicationStatus as "unpublished" | "published",
    publication_at: row.publicationAt?.toISOString() ?? null,
    publication_evidence_type: row.publicationEvidenceType,
    publication_evidence_value: row.publicationEvidenceValue,
    publication_manual_confirmation: row.publicationManualConfirmation,
    published_by: row.publishedBy,
    publication_recorded_at: row.publicationRecordedAt?.toISOString() ?? null,
    category_id: row.categoryId,
    category: category ? mapRowToCategory(category) : null,
    tags: Array.isArray(row.tagsJson) ? row.tagsJson as string[] : [],
    editorial_interest_score: row.editorialInterestScore,
    engagement_interest_count: row.engagementInterestCount,
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
    categoryId: input.category_id,
    tagsJson: input.tags ?? [],
    editorialInterestScore: input.editorial_interest_score,
    engagementInterestCount: input.engagement_interest_count ?? 0,
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
    ...(input.category_id !== undefined ? { categoryId: input.category_id } : {}),
    ...(input.tags !== undefined ? { tagsJson: input.tags } : {}),
    ...(input.editorial_interest_score !== undefined ? { editorialInterestScore: input.editorial_interest_score } : {}),
    ...(input.engagement_interest_count !== undefined ? { engagementInterestCount: input.engagement_interest_count } : {}),
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
    markdown_content: row.markdownContent,
    external_draft_url: row.externalDraftUrl,
    status: row.status,
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
    markdownContent: input.markdown_content,
    externalDraftUrl: input.external_draft_url,
    status: input.status,
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
    ...(input.markdown_content !== undefined ? { markdownContent: input.markdown_content } : {}),
    ...(input.external_draft_url !== undefined ? { externalDraftUrl: input.external_draft_url } : {}),
    ...(input.status !== undefined ? { status: input.status } : {}),
    ...(input.created_by !== undefined ? { createdBy: input.created_by } : {}),
    ...(input.metadata !== undefined ? { metadataJson: input.metadata } : {}),
    ...(input.external_source !== undefined ? { externalSource: input.external_source } : {}),
    ...(input.external_id !== undefined ? { externalId: input.external_id } : {}),
    updatedAt: new Date(),
  };
}
