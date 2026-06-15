import type { PublishingEventRow, NewPublishingEventRow } from "@/lib/db/schema";
import type { EventCreateInput, EventUpdateInput } from "@/lib/events/validation";

export type PublishingEvent = {
  id: string;
  name: string;
  publish_at: string;
  target_channel: string;
  status: string;
  content_type: string | null;
  campaign: string | null;
  owner: string | null;
  draft_url: string | null;
  media_url: string | null;
  live_url: string | null;
  topic_id: string | null;
  draft_id: string | null;
  notes: string | null;
  metadata: Record<string, unknown>;
  external_source: string | null;
  external_id: string | null;
  created_at: string;
  updated_at: string;
};

export function createEventId() {
  return `evt_${crypto.randomUUID()}`;
}

export function mapRowToEvent(row: PublishingEventRow): PublishingEvent {
  return {
    id: row.id,
    name: row.name,
    publish_at: row.publishAt.toISOString(),
    target_channel: row.targetChannel,
    status: row.status,
    content_type: row.contentType,
    campaign: row.campaign,
    owner: row.owner,
    draft_url: row.draftUrl,
    media_url: row.mediaUrl,
    live_url: row.liveUrl,
    topic_id: row.topicId,
    draft_id: row.draftId,
    notes: row.notes,
    metadata: (row.metadataJson ?? {}) as Record<string, unknown>,
    external_source: row.externalSource,
    external_id: row.externalId,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
  };
}

export function mapCreateInputToRow(input: EventCreateInput): NewPublishingEventRow {
  const now = new Date();

  return {
    id: createEventId(),
    name: input.name,
    publishAt: new Date(input.publish_at),
    targetChannel: input.target_channel,
    status: input.status,
    contentType: input.content_type,
    campaign: input.campaign,
    owner: input.owner,
    draftUrl: input.draft_url,
    mediaUrl: input.media_url,
    liveUrl: input.live_url,
    topicId: input.topic_id,
    draftId: input.draft_id,
    notes: input.notes,
    metadataJson: input.metadata ?? {},
    externalSource: input.external_source,
    externalId: input.external_id,
    createdAt: now,
    updatedAt: now,
  };
}

export function mapUpdateInputToRow(input: EventUpdateInput) {
  return {
    ...(input.name !== undefined ? { name: input.name } : {}),
    ...(input.publish_at !== undefined ? { publishAt: new Date(input.publish_at) } : {}),
    ...(input.target_channel !== undefined ? { targetChannel: input.target_channel } : {}),
    ...(input.status !== undefined ? { status: input.status } : {}),
    ...(input.content_type !== undefined ? { contentType: input.content_type } : {}),
    ...(input.campaign !== undefined ? { campaign: input.campaign } : {}),
    ...(input.owner !== undefined ? { owner: input.owner } : {}),
    ...(input.draft_url !== undefined ? { draftUrl: input.draft_url } : {}),
    ...(input.media_url !== undefined ? { mediaUrl: input.media_url } : {}),
    ...(input.live_url !== undefined ? { liveUrl: input.live_url } : {}),
    ...(input.topic_id !== undefined ? { topicId: input.topic_id } : {}),
    ...(input.draft_id !== undefined ? { draftId: input.draft_id } : {}),
    ...(input.notes !== undefined ? { notes: input.notes } : {}),
    ...(input.metadata !== undefined ? { metadataJson: input.metadata } : {}),
    ...(input.external_source !== undefined ? { externalSource: input.external_source } : {}),
    ...(input.external_id !== undefined ? { externalId: input.external_id } : {}),
    updatedAt: new Date(),
  };
}
