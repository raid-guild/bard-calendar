CREATE TABLE "content_categories" (
  "id" text PRIMARY KEY NOT NULL,
  "key" text NOT NULL,
  "name" text NOT NULL,
  "active" boolean DEFAULT true NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "metadata_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX "content_categories_key_idx" ON "content_categories" ("key");

ALTER TABLE "content_topics" ADD COLUMN "publication_status" text DEFAULT 'unpublished' NOT NULL;
ALTER TABLE "content_topics" ADD COLUMN "publication_at" timestamp with time zone;
ALTER TABLE "content_topics" ADD COLUMN "publication_evidence_type" text;
ALTER TABLE "content_topics" ADD COLUMN "publication_evidence_value" text;
ALTER TABLE "content_topics" ADD COLUMN "publication_manual_confirmation" boolean DEFAULT false NOT NULL;
ALTER TABLE "content_topics" ADD COLUMN "published_by" text;
ALTER TABLE "content_topics" ADD COLUMN "publication_recorded_at" timestamp with time zone;
ALTER TABLE "content_topics" ADD COLUMN "category_id" text REFERENCES "content_categories"("id") ON DELETE set null;
ALTER TABLE "content_topics" ADD COLUMN "tags_json" jsonb DEFAULT '[]'::jsonb NOT NULL;
ALTER TABLE "content_topics" ADD COLUMN "editorial_interest_score" integer;
ALTER TABLE "content_topics" ADD COLUMN "engagement_interest_count" integer DEFAULT 0 NOT NULL;
ALTER TABLE "content_topics" ADD CONSTRAINT "content_topics_publication_status_check" CHECK ("publication_status" IN ('unpublished', 'published'));
ALTER TABLE "content_topics" ADD CONSTRAINT "content_topics_interest_check" CHECK (("editorial_interest_score" IS NULL OR "editorial_interest_score" BETWEEN 0 AND 100) AND "engagement_interest_count" >= 0);
CREATE INDEX "content_topics_publication_idx" ON "content_topics" ("publication_status", "publication_at");
CREATE INDEX "content_topics_category_idx" ON "content_topics" ("category_id");

CREATE TABLE "content_topic_audit_events" (
  "id" text PRIMARY KEY NOT NULL,
  "topic_id" text NOT NULL REFERENCES "content_topics"("id") ON DELETE cascade,
  "action" text NOT NULL,
  "actor" text NOT NULL,
  "reason" text,
  "before_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "after_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "evidence_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX "content_topic_audit_topic_idx" ON "content_topic_audit_events" ("topic_id", "created_at");
