CREATE TABLE "publishing_events" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"publish_at" timestamp with time zone NOT NULL,
	"target_channel" text NOT NULL,
	"status" text DEFAULT 'planned' NOT NULL,
	"content_type" text,
	"campaign" text,
	"owner" text,
	"draft_url" text,
	"media_url" text,
	"live_url" text,
	"notes" text,
	"metadata_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"external_source" text,
	"external_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "publishing_events_external_identity_idx" ON "publishing_events" USING btree ("external_source","external_id");