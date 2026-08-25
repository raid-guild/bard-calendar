ALTER TABLE "publishing_events" ADD COLUMN "attribution" text;
ALTER TABLE "publishing_events" ADD COLUMN "publisher_account" text;

-- Trim the only canonical representation this release promises. Abort instead of
-- discarding data if existing rows collapse to the same URL.
UPDATE "publishing_events"
SET "live_url" = NULLIF(BTRIM("live_url"), '')
WHERE "live_url" IS NOT NULL;

CREATE UNIQUE INDEX "publishing_events_live_url_idx"
ON "publishing_events" USING btree ("live_url")
WHERE "live_url" IS NOT NULL;
