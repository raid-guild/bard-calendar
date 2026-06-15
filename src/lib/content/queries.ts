import { and, asc, count, eq, ilike, or } from "drizzle-orm";
import { mapCreateDraftInputToRow, mapCreateTopicInputToRow, mapRowToDraft, mapRowToTopic, mapUpdateDraftInputToRow, mapUpdateTopicInputToRow } from "@/lib/content/mapping";
import type { DraftAssignEventInput, DraftCreateInput, DraftListQuery, DraftUpdateInput, TopicCreateInput, TopicListQuery, TopicUpdateInput } from "@/lib/content/validation";
import { getDb } from "@/lib/db/client";
import { contentDrafts, contentTopics, draftDaggers, publishingEvents } from "@/lib/db/schema";
import { createEvent } from "@/lib/events/queries";

export async function listTopics(filters: TopicListQuery = {}) {
  const db = getDb();
  const clauses = [
    filters.status ? eq(contentTopics.status, filters.status) : undefined,
    filters.search
      ? or(
          ilike(contentTopics.title, `%${filters.search}%`),
          ilike(contentTopics.supportingMaterialMarkdown, `%${filters.search}%`),
        )
      : undefined,
  ].filter(Boolean);

  const rows = await db
    .select()
    .from(contentTopics)
    .where(clauses.length ? and(...clauses) : undefined)
    .orderBy(asc(contentTopics.createdAt));

  const draftCounts = await db
    .select({ topicId: contentDrafts.topicId, value: count() })
    .from(contentDrafts)
    .groupBy(contentDrafts.topicId);
  const draftCountByTopic = new Map(draftCounts.map((row) => [row.topicId, Number(row.value)]));

  return rows.map((row) => mapRowToTopic(row, draftCountByTopic.get(row.id) ?? 0));
}

export async function getTopic(id: string) {
  const db = getDb();
  const [row] = await db.select().from(contentTopics).where(eq(contentTopics.id, id));

  if (!row) {
    return null;
  }

  const [draftCount] = await db
    .select({ value: count() })
    .from(contentDrafts)
    .where(eq(contentDrafts.topicId, id));

  return mapRowToTopic(row, Number(draftCount?.value ?? 0));
}

export async function createTopic(input: TopicCreateInput) {
  const db = getDb();
  const [row] = await db.insert(contentTopics).values(mapCreateTopicInputToRow(input)).returning();
  return mapRowToTopic(row);
}

export async function updateTopic(id: string, input: TopicUpdateInput) {
  const db = getDb();
  const [row] = await db
    .update(contentTopics)
    .set(mapUpdateTopicInputToRow(input))
    .where(eq(contentTopics.id, id))
    .returning();

  return row ? mapRowToTopic(row) : null;
}

export async function deleteTopic(id: string) {
  const db = getDb();
  const [row] = await db.delete(contentTopics).where(eq(contentTopics.id, id)).returning();
  return row ? mapRowToTopic(row) : null;
}

export async function upsertTopic(input: TopicCreateInput & { external_source: string; external_id: string }) {
  const db = getDb();
  const now = new Date();
  const [row] = await db
    .insert(contentTopics)
    .values(mapCreateTopicInputToRow(input))
    .onConflictDoUpdate({
      target: [contentTopics.externalSource, contentTopics.externalId],
      set: {
        title: input.title,
        supportingMaterialMarkdown: input.supporting_material_markdown,
        status: input.status,
        createdBy: input.created_by,
        metadataJson: input.metadata ?? {},
        externalSource: input.external_source,
        externalId: input.external_id,
        updatedAt: now,
      },
    })
    .returning();

  return mapRowToTopic(row);
}

async function draftDecorations(userId?: string | null) {
  const db = getDb();
  const daggerCounts = await db
    .select({ draftId: draftDaggers.draftId, value: count() })
    .from(draftDaggers)
    .groupBy(draftDaggers.draftId);
  const daggerCountByDraft = new Map(daggerCounts.map((row) => [row.draftId, Number(row.value)]));

  const userDaggers = userId
    ? await db.select({ draftId: draftDaggers.draftId }).from(draftDaggers).where(eq(draftDaggers.userId, userId))
    : [];
  const userDaggerDrafts = new Set(userDaggers.map((row) => row.draftId));

  const assignedEvents = await db
    .select({
      id: publishingEvents.id,
      draftId: publishingEvents.draftId,
      publishAt: publishingEvents.publishAt,
      liveUrl: publishingEvents.liveUrl,
    })
    .from(publishingEvents);
  const assignedByDraft = new Map(
    assignedEvents
      .filter((row) => row.draftId)
      .map((row) => [row.draftId!, { id: row.id, publishAt: row.publishAt, liveUrl: row.liveUrl }]),
  );

  return { daggerCountByDraft, userDaggerDrafts, assignedByDraft };
}

export async function listDrafts(filters: DraftListQuery = {}, userId?: string | null) {
  const db = getDb();
  const clauses = [
    filters.topic_id ? eq(contentDrafts.topicId, filters.topic_id) : undefined,
    filters.target_channel ? eq(contentDrafts.targetChannel, filters.target_channel) : undefined,
    filters.status ? eq(contentDrafts.status, filters.status) : undefined,
    filters.search
      ? or(ilike(contentDrafts.title, `%${filters.search}%`), ilike(contentDrafts.markdownContent, `%${filters.search}%`))
      : undefined,
  ].filter(Boolean);

  const rows = await db
    .select()
    .from(contentDrafts)
    .where(clauses.length ? and(...clauses) : undefined)
    .orderBy(asc(contentDrafts.createdAt));
  const { daggerCountByDraft, userDaggerDrafts, assignedByDraft } = await draftDecorations(userId);

  return rows.map((row) =>
    mapRowToDraft(row, daggerCountByDraft.get(row.id) ?? 0, userDaggerDrafts.has(row.id), assignedByDraft.get(row.id) ?? null),
  );
}

export async function getDraft(id: string, userId?: string | null) {
  const db = getDb();
  const [row] = await db.select().from(contentDrafts).where(eq(contentDrafts.id, id));

  if (!row) {
    return null;
  }

  const { daggerCountByDraft, userDaggerDrafts, assignedByDraft } = await draftDecorations(userId);
  return mapRowToDraft(row, daggerCountByDraft.get(row.id) ?? 0, userDaggerDrafts.has(row.id), assignedByDraft.get(row.id) ?? null);
}

export async function createDraft(input: DraftCreateInput) {
  const db = getDb();
  const [row] = await db.insert(contentDrafts).values(mapCreateDraftInputToRow(input)).returning();
  return mapRowToDraft(row);
}

export async function updateDraft(id: string, input: DraftUpdateInput) {
  const db = getDb();
  const [row] = await db
    .update(contentDrafts)
    .set(mapUpdateDraftInputToRow(input))
    .where(eq(contentDrafts.id, id))
    .returning();

  return row ? mapRowToDraft(row) : null;
}

export async function deleteDraft(id: string) {
  const db = getDb();
  const [row] = await db.delete(contentDrafts).where(eq(contentDrafts.id, id)).returning();
  return row ? mapRowToDraft(row) : null;
}

export async function upsertDraft(input: DraftCreateInput & { external_source: string; external_id: string }) {
  const db = getDb();
  const now = new Date();
  const [row] = await db
    .insert(contentDrafts)
    .values(mapCreateDraftInputToRow(input))
    .onConflictDoUpdate({
      target: [contentDrafts.externalSource, contentDrafts.externalId],
      set: {
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
        updatedAt: now,
      },
    })
    .returning();

  return mapRowToDraft(row);
}

export async function addDraftDagger(draftId: string, userId: string, userLabel?: string | null) {
  const db = getDb();
  await db
    .insert(draftDaggers)
    .values({ draftId, userId, userLabel })
    .onConflictDoNothing({ target: [draftDaggers.draftId, draftDaggers.userId] });
  return getDraft(draftId, userId);
}

export async function removeDraftDagger(draftId: string, userId: string) {
  const db = getDb();
  await db
    .delete(draftDaggers)
    .where(and(eq(draftDaggers.draftId, draftId), eq(draftDaggers.userId, userId)));
  return getDraft(draftId, userId);
}

export async function assignDraftToEvent(draftId: string, input: DraftAssignEventInput) {
  const draft = await getDraft(draftId);

  if (!draft) {
    return null;
  }

  const event = await createEvent({
    name: input.name ?? draft.title,
    publish_at: input.publish_at,
    target_channel: draft.target_channel,
    status: input.status,
    content_type: input.content_type,
    campaign: input.campaign,
    owner: input.owner,
    draft_url: draft.external_draft_url,
    media_url: input.media_url,
    live_url: input.live_url,
    topic_id: draft.topic_id,
    draft_id: draft.id,
    notes: input.notes,
    metadata: input.metadata,
  });

  await updateDraft(draft.id, { status: "assigned" });

  return event;
}
