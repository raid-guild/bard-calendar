ALTER TABLE "content_topics" ADD COLUMN IF NOT EXISTS "owner" text;
ALTER TABLE "content_topics" ADD COLUMN IF NOT EXISTS "priority" text DEFAULT 'normal' NOT NULL;
ALTER TABLE "content_topics" ADD COLUMN IF NOT EXISTS "parked_reason" text;
ALTER TABLE "content_topics" ADD COLUMN IF NOT EXISTS "revisit_at" timestamp with time zone;
ALTER TABLE "content_drafts" ADD COLUMN IF NOT EXISTS "route_platform" text;
ALTER TABLE "content_drafts" ADD COLUMN IF NOT EXISTS "route_account" text;
ALTER TABLE "content_drafts" ADD COLUMN IF NOT EXISTS "route_format" text;
ALTER TABLE "content_drafts" ADD COLUMN IF NOT EXISTS "editorial_status" text DEFAULT 'draft' NOT NULL;
ALTER TABLE "content_drafts" ADD COLUMN IF NOT EXISTS "approval_invalidated_at" timestamp with time zone;
ALTER TABLE "content_drafts" ADD COLUMN IF NOT EXISTS "approved_at" timestamp with time zone;
ALTER TABLE "content_drafts" ADD COLUMN IF NOT EXISTS "approved_by" text;
ALTER TABLE "content_drafts" ADD COLUMN IF NOT EXISTS "audit_json" jsonb DEFAULT '[]'::jsonb NOT NULL;
ALTER TABLE "content_bundle_runs" ADD COLUMN IF NOT EXISTS "idempotency_key" text;
ALTER TABLE "publishing_events" ADD COLUMN IF NOT EXISTS "route_platform" text;
ALTER TABLE "publishing_events" ADD COLUMN IF NOT EXISTS "route_account" text;
ALTER TABLE "publishing_events" ADD COLUMN IF NOT EXISTS "route_format" text;
CREATE INDEX IF NOT EXISTS "content_topics_revisit_idx" ON "content_topics" ("status", "revisit_at");
CREATE INDEX IF NOT EXISTS "content_drafts_route_idx" ON "content_drafts" ("route_platform", "route_account", "route_format");
CREATE INDEX IF NOT EXISTS "content_drafts_editorial_idx" ON "content_drafts" ("editorial_status");
CREATE UNIQUE INDEX IF NOT EXISTS "content_bundle_runs_idempotency_idx" ON "content_bundle_runs" ("topic_id", "idempotency_key") WHERE "idempotency_key" IS NOT NULL;

UPDATE "content_drafts" SET
  "route_platform" = CASE
    WHEN lower("target_channel") LIKE 'x:%' THEN 'x'
    WHEN lower("target_channel") = 'linkedin' THEN 'linkedin'
    WHEN lower("target_channel") LIKE 'website:%' THEN 'website'
    WHEN lower("target_channel") IN ('paragraph', 'farcaster', 'newsletter', 'discord') THEN lower("target_channel")
    ELSE NULL END,
  "route_account" = CASE
    WHEN lower("target_channel") = 'x: main account' THEN 'raidguild'
    WHEN lower("target_channel") = 'x: raida' THEN 'queen-raida'
    WHEN lower("target_channel") = 'website: .ia' THEN 'raidguild-ia'
    WHEN lower("target_channel") = 'website: .org' THEN 'raidguild-org'
    WHEN lower("target_channel") = 'website: raida' THEN 'queen-raida'
    ELSE NULL END,
  "route_format" = CASE WHEN lower("target_channel") = 'linkedin' THEN 'post' ELSE NULL END
WHERE "route_platform" IS NULL;
