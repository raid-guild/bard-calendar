import { jsonb, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const publishingEvents = pgTable(
  "publishing_events",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    publishAt: timestamp("publish_at", { withTimezone: true }).notNull(),
    targetChannel: text("target_channel").notNull(),
    status: text("status").notNull().default("planned"),
    contentType: text("content_type"),
    campaign: text("campaign"),
    owner: text("owner"),
    draftUrl: text("draft_url"),
    mediaUrl: text("media_url"),
    liveUrl: text("live_url"),
    notes: text("notes"),
    metadataJson: jsonb("metadata_json").notNull().default({}),
    externalSource: text("external_source"),
    externalId: text("external_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    externalIdentityIdx: uniqueIndex("publishing_events_external_identity_idx").on(
      table.externalSource,
      table.externalId,
    ),
  }),
);

export type PublishingEventRow = typeof publishingEvents.$inferSelect;
export type NewPublishingEventRow = typeof publishingEvents.$inferInsert;
