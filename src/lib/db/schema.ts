import { index, jsonb, pgTable, primaryKey, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const contentTopics = pgTable(
  "content_topics",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    supportingMaterialMarkdown: text("supporting_material_markdown"),
    status: text("status").notNull().default("active"),
    createdBy: text("created_by"),
    metadataJson: jsonb("metadata_json").notNull().default({}),
    externalSource: text("external_source"),
    externalId: text("external_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    externalIdentityIdx: uniqueIndex("content_topics_external_identity_idx").on(
      table.externalSource,
      table.externalId,
    ),
    statusIdx: index("content_topics_status_idx").on(table.status),
  }),
);

export const contentDrafts = pgTable(
  "content_drafts",
  {
    id: text("id").primaryKey(),
    topicId: text("topic_id")
      .notNull()
      .references(() => contentTopics.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    targetChannel: text("target_channel").notNull(),
    markdownContent: text("markdown_content").notNull().default(""),
    externalDraftUrl: text("external_draft_url"),
    status: text("status").notNull().default("draft"),
    createdBy: text("created_by"),
    metadataJson: jsonb("metadata_json").notNull().default({}),
    externalSource: text("external_source"),
    externalId: text("external_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    externalIdentityIdx: uniqueIndex("content_drafts_external_identity_idx").on(
      table.externalSource,
      table.externalId,
    ),
    topicIdx: index("content_drafts_topic_idx").on(table.topicId),
    statusIdx: index("content_drafts_status_idx").on(table.status),
  }),
);

export const contentBundleRuns = pgTable(
  "content_bundle_runs",
  {
    id: text("id").primaryKey(),
    topicId: text("topic_id")
      .notNull()
      .references(() => contentTopics.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("queued"),
    stage: text("stage").notNull().default("queued"),
    sourceSystem: text("source_system").notNull().default("portal-post"),
    sourceId: text("source_id").notNull(),
    sourceUrl: text("source_url"),
    sourceRevision: text("source_revision"),
    prismRequestId: text("prism_request_id"),
    requestedChannelsJson: jsonb("requested_channels_json").notNull().default([]),
    optionsJson: jsonb("options_json").notNull().default({}),
    auditJson: jsonb("audit_json").notNull().default([]),
    instructions: text("instructions"),
    errorMessage: text("error_message"),
    createdBy: text("created_by"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    topicIdx: index("content_bundle_runs_topic_idx").on(table.topicId),
    statusIdx: index("content_bundle_runs_status_idx").on(table.status),
    prismRequestIdx: uniqueIndex("content_bundle_runs_prism_request_idx").on(
      table.prismRequestId,
    ),
  }),
);

export const contentAssets = pgTable(
  "content_assets",
  {
    id: text("id").primaryKey(),
    topicId: text("topic_id")
      .notNull()
      .references(() => contentTopics.id, { onDelete: "cascade" }),
    draftId: text("draft_id").references(() => contentDrafts.id, {
      onDelete: "set null",
    }),
    kind: text("kind").notNull(),
    status: text("status").notNull().default("generated"),
    targetChannel: text("target_channel"),
    prismRequestId: text("prism_request_id").notNull(),
    prismArtifactId: text("prism_artifact_id").notNull(),
    stableUrl: text("stable_url"),
    mimeType: text("mime_type"),
    prompt: text("prompt"),
    metadataJson: jsonb("metadata_json").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    artifactIdentityIdx: uniqueIndex("content_assets_artifact_identity_idx").on(
      table.prismRequestId,
      table.prismArtifactId,
    ),
    topicIdx: index("content_assets_topic_idx").on(table.topicId),
    draftIdx: index("content_assets_draft_idx").on(table.draftId),
  }),
);

export const draftDaggers = pgTable(
  "draft_daggers",
  {
    draftId: text("draft_id")
      .notNull()
      .references(() => contentDrafts.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    userLabel: text("user_label"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.draftId, table.userId] }),
    draftIdx: index("draft_daggers_draft_idx").on(table.draftId),
  }),
);

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
    attribution: text("attribution"),
    publisherAccount: text("publisher_account"),
    draftUrl: text("draft_url"),
    mediaUrl: text("media_url"),
    liveUrl: text("live_url"),
    topicId: text("topic_id").references(() => contentTopics.id, { onDelete: "set null" }),
    draftId: text("draft_id").references(() => contentDrafts.id, { onDelete: "set null" }),
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
    topicIdx: index("publishing_events_topic_idx").on(table.topicId),
    draftIdx: index("publishing_events_draft_idx").on(table.draftId),
    liveUrlIdx: uniqueIndex("publishing_events_live_url_idx")
      .on(table.liveUrl)
      .where(sql`${table.liveUrl} is not null`),
  }),
);

export type ContentTopicRow = typeof contentTopics.$inferSelect;
export type NewContentTopicRow = typeof contentTopics.$inferInsert;
export type ContentDraftRow = typeof contentDrafts.$inferSelect;
export type NewContentDraftRow = typeof contentDrafts.$inferInsert;
export type ContentBundleRunRow = typeof contentBundleRuns.$inferSelect;
export type NewContentBundleRunRow = typeof contentBundleRuns.$inferInsert;
export type ContentAssetRow = typeof contentAssets.$inferSelect;
export type NewContentAssetRow = typeof contentAssets.$inferInsert;
export type DraftDaggerRow = typeof draftDaggers.$inferSelect;
export type NewDraftDaggerRow = typeof draftDaggers.$inferInsert;
export type PublishingEventRow = typeof publishingEvents.$inferSelect;
export type NewPublishingEventRow = typeof publishingEvents.$inferInsert;
