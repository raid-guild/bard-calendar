CREATE TABLE "content_drafts" (
	"id" text PRIMARY KEY NOT NULL,
	"topic_id" text NOT NULL,
	"title" text NOT NULL,
	"target_channel" text NOT NULL,
	"markdown_content" text DEFAULT '' NOT NULL,
	"external_draft_url" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"created_by" text,
	"metadata_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"external_source" text,
	"external_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_topics" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"supporting_material_markdown" text,
	"status" text DEFAULT 'active' NOT NULL,
	"created_by" text,
	"metadata_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"external_source" text,
	"external_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "draft_daggers" (
	"draft_id" text NOT NULL,
	"user_id" text NOT NULL,
	"user_label" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "draft_daggers_draft_id_user_id_pk" PRIMARY KEY("draft_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "publishing_events" ADD COLUMN "topic_id" text;--> statement-breakpoint
ALTER TABLE "publishing_events" ADD COLUMN "draft_id" text;--> statement-breakpoint
ALTER TABLE "content_drafts" ADD CONSTRAINT "content_drafts_topic_id_content_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."content_topics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "draft_daggers" ADD CONSTRAINT "draft_daggers_draft_id_content_drafts_id_fk" FOREIGN KEY ("draft_id") REFERENCES "public"."content_drafts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "content_drafts_external_identity_idx" ON "content_drafts" USING btree ("external_source","external_id");--> statement-breakpoint
CREATE INDEX "content_drafts_topic_idx" ON "content_drafts" USING btree ("topic_id");--> statement-breakpoint
CREATE INDEX "content_drafts_status_idx" ON "content_drafts" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "content_topics_external_identity_idx" ON "content_topics" USING btree ("external_source","external_id");--> statement-breakpoint
CREATE INDEX "content_topics_status_idx" ON "content_topics" USING btree ("status");--> statement-breakpoint
CREATE INDEX "draft_daggers_draft_idx" ON "draft_daggers" USING btree ("draft_id");--> statement-breakpoint
ALTER TABLE "publishing_events" ADD CONSTRAINT "publishing_events_topic_id_content_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."content_topics"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "publishing_events" ADD CONSTRAINT "publishing_events_draft_id_content_drafts_id_fk" FOREIGN KEY ("draft_id") REFERENCES "public"."content_drafts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "publishing_events_topic_idx" ON "publishing_events" USING btree ("topic_id");--> statement-breakpoint
CREATE INDEX "publishing_events_draft_idx" ON "publishing_events" USING btree ("draft_id");