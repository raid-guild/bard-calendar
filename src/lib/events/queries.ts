import { and, asc, eq, gte, ilike, lte, or } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { publishingEvents } from "@/lib/db/schema";
import { mapCreateInputToRow, mapRowToEvent, mapUpdateInputToRow } from "@/lib/events/mapping";
import type { EventCreateInput, EventListQuery, EventUpdateInput } from "@/lib/events/validation";

export async function listEvents(filters: EventListQuery = {}) {
  const db = getDb();
  const clauses = [
    filters.start ? gte(publishingEvents.publishAt, new Date(filters.start)) : undefined,
    filters.end ? lte(publishingEvents.publishAt, new Date(filters.end)) : undefined,
    filters.target_channel ? eq(publishingEvents.targetChannel, filters.target_channel) : undefined,
    filters.status ? eq(publishingEvents.status, filters.status) : undefined,
    filters.owner ? eq(publishingEvents.owner, filters.owner) : undefined,
    filters.name ? ilike(publishingEvents.name, `%${filters.name}%`) : undefined,
    filters.search
      ? or(
          ilike(publishingEvents.name, `%${filters.search}%`),
          ilike(publishingEvents.notes, `%${filters.search}%`),
          ilike(publishingEvents.campaign, `%${filters.search}%`),
        )
      : undefined,
  ].filter(Boolean);

  const rows = await db
    .select()
    .from(publishingEvents)
    .where(clauses.length ? and(...clauses) : undefined)
    .orderBy(asc(publishingEvents.publishAt));

  return rows.map(mapRowToEvent);
}

export async function createEvent(input: EventCreateInput) {
  const db = getDb();
  const [row] = await db
    .insert(publishingEvents)
    .values(mapCreateInputToRow(input))
    .returning();

  return mapRowToEvent(row);
}

export async function updateEvent(id: string, input: EventUpdateInput) {
  const db = getDb();
  const [row] = await db
    .update(publishingEvents)
    .set(mapUpdateInputToRow(input))
    .where(eq(publishingEvents.id, id))
    .returning();

  return row ? mapRowToEvent(row) : null;
}

export async function deleteEvent(id: string) {
  const db = getDb();
  const [row] = await db
    .delete(publishingEvents)
    .where(eq(publishingEvents.id, id))
    .returning();

  return row ? mapRowToEvent(row) : null;
}

export async function upsertEvent(input: EventCreateInput & { external_source: string; external_id: string }) {
  const db = getDb();
  const now = new Date();
  const insertRow = mapCreateInputToRow(input);
  const [row] = await db
    .insert(publishingEvents)
    .values(insertRow)
    .onConflictDoUpdate({
      target: [publishingEvents.externalSource, publishingEvents.externalId],
      set: {
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
        notes: input.notes,
        metadataJson: input.metadata ?? {},
        externalSource: input.external_source,
        externalId: input.external_id,
        updatedAt: now,
      },
    })
    .returning();

  return mapRowToEvent(row);
}
