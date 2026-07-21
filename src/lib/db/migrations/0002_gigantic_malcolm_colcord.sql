CREATE TABLE "content_assets" (
	"id" text PRIMARY KEY NOT NULL,
	"topic_id" text NOT NULL,
	"draft_id" text,
	"kind" text NOT NULL,
	"status" text DEFAULT 'generated' NOT NULL,
	"target_channel" text,
	"prism_request_id" text NOT NULL,
	"prism_artifact_id" text NOT NULL,
	"stable_url" text,
	"mime_type" text,
	"prompt" text,
	"metadata_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_bundle_runs" (
	"id" text PRIMARY KEY NOT NULL,
	"topic_id" text NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"stage" text DEFAULT 'queued' NOT NULL,
	"source_system" text DEFAULT 'portal-post' NOT NULL,
	"source_id" text NOT NULL,
	"source_url" text,
	"source_revision" text,
	"prism_request_id" text,
	"requested_channels_json" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"options_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"audit_json" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"instructions" text,
	"error_message" text,
	"created_by" text,
	"started_at" timestamp with time zone,
	"finished_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "content_assets" ADD CONSTRAINT "content_assets_topic_id_content_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."content_topics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_assets" ADD CONSTRAINT "content_assets_draft_id_content_drafts_id_fk" FOREIGN KEY ("draft_id") REFERENCES "public"."content_drafts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_bundle_runs" ADD CONSTRAINT "content_bundle_runs_topic_id_content_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."content_topics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "content_assets_artifact_identity_idx" ON "content_assets" USING btree ("prism_request_id","prism_artifact_id");--> statement-breakpoint
CREATE INDEX "content_assets_topic_idx" ON "content_assets" USING btree ("topic_id");--> statement-breakpoint
CREATE INDEX "content_assets_draft_idx" ON "content_assets" USING btree ("draft_id");--> statement-breakpoint
CREATE INDEX "content_bundle_runs_topic_idx" ON "content_bundle_runs" USING btree ("topic_id");--> statement-breakpoint
CREATE INDEX "content_bundle_runs_status_idx" ON "content_bundle_runs" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "content_bundle_runs_prism_request_idx" ON "content_bundle_runs" USING btree ("prism_request_id");