import { and, asc, count, desc, eq, gte, ilike, lte, or, sql } from "drizzle-orm";
import { mapCreateDraftInputToRow, mapCreateTopicInputToRow, mapRowToCategory, mapRowToDraft, mapRowToTopic, mapUpdateDraftInputToRow, mapUpdateTopicInputToRow } from "@/lib/content/mapping";
import type { CategoryCreateInput, DraftAssignEventInput, DraftCreateInput, DraftListQuery, DraftMarkPublishedInput, DraftUpdateInput, TopicCreateInput, TopicListQuery, TopicPublishInput, TopicReopenInput, TopicUpdateInput } from "@/lib/content/validation";
import { getDb } from "@/lib/db/client";
import { contentCategories, contentDrafts, contentTopicAuditEvents, contentTopics, draftDaggers, publishingEvents } from "@/lib/db/schema";
import { createEvent, updateEvent } from "@/lib/events/queries";
import { createEventId, mapRowToEvent } from "@/lib/events/mapping";
import { LiveUrlConflictError, normalizeLiveUrl } from "@/lib/events/live-url";

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
    filters.publication_status ? eq(contentTopics.publicationStatus, filters.publication_status) : undefined,
    filters.publication_start ? gte(contentTopics.publicationAt, new Date(filters.publication_start)) : undefined,
    filters.publication_end ? lte(contentTopics.publicationAt, new Date(filters.publication_end)) : undefined,
    filters.category_id === "uncategorized" ? sql`${contentTopics.categoryId} is null` : filters.category_id ? eq(contentTopics.categoryId, filters.category_id) : undefined,
    filters.tag ? sql`${contentTopics.tagsJson} @> ${JSON.stringify([filters.tag])}::jsonb` : undefined,
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

  const categories = await db.select().from(contentCategories);
  const categoryById = new Map(categories.map((category) => [category.id, category]));
  return rows.map((row) => mapRowToTopic(row, draftCountByTopic.get(row.id) ?? 0, row.categoryId ? categoryById.get(row.categoryId) ?? null : null));
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

  const [category] = row.categoryId ? await db.select().from(contentCategories).where(eq(contentCategories.id, row.categoryId)) : [];
  return mapRowToTopic(row, Number(draftCount?.value ?? 0), category ?? null);
}

export async function getTopicByExternalIdentity(
  externalSource: string,
  externalId: string,
) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(contentTopics)
    .where(
      and(
        eq(contentTopics.externalSource, externalSource),
        eq(contentTopics.externalId, externalId),
      ),
    );
  return row ? mapRowToTopic(row) : null;
}

export async function createTopic(input: TopicCreateInput) {
  const db = getDb();
  const [row] = await db.insert(contentTopics).values(mapCreateTopicInputToRow(input)).returning();
  return mapRowToTopic(row);
}

export async function updateTopic(id: string, input: TopicUpdateInput) {
  const db = getDb();
  return db.transaction(async (tx) => {
    const [before] = await tx.select().from(contentTopics).where(eq(contentTopics.id, id)).for("update");
    if (!before) return null;
    const [row] = await tx.update(contentTopics).set(mapUpdateTopicInputToRow(input)).where(eq(contentTopics.id, id)).returning();
    const tracked = input.category_id !== undefined || input.tags !== undefined || input.editorial_interest_score !== undefined || input.engagement_interest_count !== undefined;
    if (tracked) {
      const previous = { category_id: before.categoryId, tags: before.tagsJson, editorial_interest_score: before.editorialInterestScore, engagement_interest_count: before.engagementInterestCount };
      const next = { category_id: row.categoryId, tags: row.tagsJson, editorial_interest_score: row.editorialInterestScore, engagement_interest_count: row.engagementInterestCount };
      await tx.insert(contentTopicAuditEvents).values({ id: `tae_${crypto.randomUUID()}`, topicId: id, action: "classification_updated", actor: input.created_by ?? "system", beforeJson: previous, afterJson: next, evidenceJson: {} });
    }
    return mapRowToTopic(row);
  });
}

export async function listCategories(includeInactive = false) {
  const rows = await getDb().select().from(contentCategories)
    .where(includeInactive ? undefined : eq(contentCategories.active, true))
    .orderBy(asc(contentCategories.sortOrder), asc(contentCategories.name));
  return rows.map(mapRowToCategory);
}

export async function createCategory(input: CategoryCreateInput) {
  const now = new Date();
  const [row] = await getDb().insert(contentCategories).values({
    id: `cat_${crypto.randomUUID()}`, key: input.key, name: input.name, active: input.active,
    sortOrder: input.sort_order, metadataJson: input.metadata, createdAt: now, updatedAt: now,
  }).returning();
  return mapRowToCategory(row);
}

function publicationSnapshot(row: typeof contentTopics.$inferSelect) {
  return {
    publication_status: row.publicationStatus,
    publication_at: row.publicationAt?.toISOString() ?? null,
    evidence_type: row.publicationEvidenceType,
    evidence_value: row.publicationEvidenceValue,
    manual_confirmation: row.publicationManualConfirmation,
    published_by: row.publishedBy,
  };
}

export async function publishTopic(id: string, input: TopicPublishInput) {
  const db = getDb();
  return db.transaction(async (tx) => {
    const [before] = await tx.select().from(contentTopics).where(eq(contentTopics.id, id)).for("update");
    if (!before) return null;
    const recordedAt = new Date();
    const [after] = await tx.update(contentTopics).set({
      publicationStatus: "published", publicationAt: new Date(input.publication_at),
      publicationEvidenceType: input.evidence_type, publicationEvidenceValue: input.evidence_value,
      publicationManualConfirmation: input.manual_confirmation, publishedBy: input.actor,
      publicationRecordedAt: recordedAt, updatedAt: recordedAt,
    }).where(eq(contentTopics.id, id)).returning();
    await tx.insert(contentTopicAuditEvents).values({
      id: `tae_${crypto.randomUUID()}`, topicId: id, action: "published", actor: input.actor,
      beforeJson: publicationSnapshot(before), afterJson: publicationSnapshot(after),
      evidenceJson: { type: input.evidence_type, value: input.evidence_value, manual_confirmation: input.manual_confirmation },
    });
    return mapRowToTopic(after);
  });
}

export async function reopenTopic(id: string, input: TopicReopenInput) {
  const db = getDb();
  return db.transaction(async (tx) => {
    const [before] = await tx.select().from(contentTopics).where(eq(contentTopics.id, id)).for("update");
    if (!before) return null;
    const [after] = await tx.update(contentTopics).set({
      publicationStatus: "unpublished", publicationAt: null, publicationEvidenceType: null,
      publicationEvidenceValue: null, publicationManualConfirmation: false, publishedBy: null,
      publicationRecordedAt: null, updatedAt: new Date(),
    }).where(eq(contentTopics.id, id)).returning();
    await tx.insert(contentTopicAuditEvents).values({
      id: `tae_${crypto.randomUUID()}`, topicId: id, action: "reopened", actor: input.actor,
      reason: input.reason, beforeJson: publicationSnapshot(before), afterJson: publicationSnapshot(after),
      evidenceJson: {},
    });
    return mapRowToTopic(after);
  });
}

export async function listTopicAuditEvents(topicId: string) {
  const rows = await getDb().select().from(contentTopicAuditEvents)
    .where(eq(contentTopicAuditEvents.topicId, topicId)).orderBy(desc(contentTopicAuditEvents.createdAt));
  return rows.map((row) => ({ id: row.id, topic_id: row.topicId, action: row.action, actor: row.actor,
    reason: row.reason, before: row.beforeJson, after: row.afterJson, evidence: row.evidenceJson,
    created_at: row.createdAt.toISOString() }));
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

  const eventInput = {
    name: input.name ?? draft.title,
    publish_at: input.publish_at,
    target_channel: draft.target_channel,
    status: input.status,
    content_type: input.content_type,
    campaign: input.campaign,
    owner: input.owner,
    attribution: input.attribution,
    publisher_account: input.publisher_account,
    draft_url: draft.external_draft_url,
    media_url: input.media_url,
    live_url: input.live_url,
    topic_id: draft.topic_id,
    draft_id: draft.id,
    notes: input.notes,
    metadata: input.metadata,
  };
  const event = draft.assigned_event_id
    ? await updateEvent(draft.assigned_event_id, eventInput)
    : await createEvent(eventInput);

  if (!event) {
    return null;
  }

  await updateDraft(draft.id, { status: "assigned" });

  return event;
}

export async function markDraftPublished(draftId: string, input: DraftMarkPublishedInput) {
  const db = getDb();
  const liveUrl = normalizeLiveUrl(input.live_url);

  return db.transaction(async (tx) => {
    const [draft] = await tx.select().from(contentDrafts).where(eq(contentDrafts.id, draftId));
    if (!draft) return null;

    const [urlOwner] = await tx
      .select({ id: publishingEvents.id, draftId: publishingEvents.draftId })
      .from(publishingEvents)
      .where(eq(publishingEvents.liveUrl, liveUrl));
    if (urlOwner && urlOwner.draftId !== draftId) throw new LiveUrlConflictError();

    const linked = await tx
      .select()
      .from(publishingEvents)
      .where(eq(publishingEvents.draftId, draftId))
      .orderBy(asc(publishingEvents.createdAt));
    const existing = urlOwner
      ? linked.find((event) => event.id === urlOwner.id)
      : linked[0];
    const now = new Date();
    const values = {
      name: input.name !== undefined ? input.name ?? draft.title : existing?.name ?? draft.title,
      publishAt: new Date(input.published_at),
      targetChannel: draft.targetChannel,
      status: "published",
      campaign: input.campaign !== undefined ? input.campaign : existing?.campaign,
      owner: input.owner !== undefined ? input.owner : existing?.owner,
      attribution: input.attribution !== undefined ? input.attribution : existing?.attribution,
      publisherAccount: input.publisher_account !== undefined ? input.publisher_account : existing?.publisherAccount,
      draftUrl: draft.externalDraftUrl ?? existing?.draftUrl,
      liveUrl,
      topicId: draft.topicId,
      draftId: draft.id,
      notes: input.notes !== undefined ? input.notes : existing?.notes,
      updatedAt: now,
    };
    const [event] = existing
      ? await tx.update(publishingEvents).set(values).where(eq(publishingEvents.id, existing.id)).returning()
      : await tx.insert(publishingEvents).values({ id: createEventId(), ...values, createdAt: now }).returning();

    await tx.update(contentDrafts).set({ status: "published", updatedAt: now }).where(eq(contentDrafts.id, draft.id));
    return mapRowToEvent(event);
  });
}
