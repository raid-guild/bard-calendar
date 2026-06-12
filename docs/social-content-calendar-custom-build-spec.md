# RaidGuild Social Content Calendar - Custom Build Spec

Status: draft handoff spec
Date: June 11, 2026

## Purpose

Build a lightweight internal social content calendar for RaidGuild. The app should let humans view and manage publishing events while giving planner/creator agents a simple API for pushing planned events into the calendar.

This is not a full social media scheduler in the MVP. It tracks publishing intent, drafts, media links, statuses, and channel targets. Direct publishing, SSO, and deep portal integration come later.

## MVP Goals

- Calendar UI for viewing publishing events by month and week.
- List/table view for filtering events by channel, status, owner, and date.
- Add/edit/delete publishing events from the UI.
- API endpoints for a content planner/creator agent to create, update, and upsert events.
- Simple static bearer-token API auth.
- Deploy on Railway.
- Use Next.js for frontend, server, and API.
- Use Tailwind theme already prepared by RaidGuild.
- Use shadcn/ui for common interface components.
- Use React Big Calendar for the calendar surface.

## Non-Goals For MVP

- User login/auth in the app.
- RaidGuild portal SSO.
- Direct publishing to Discord, X, LinkedIn, etc.
- OAuth social account connection.
- Approval workflows beyond event status.
- Analytics ingestion.
- Asset hosting/media library.
- Multi-tenant organizations.

## Post-MVP Goals

- Add auth using SSO from an existing RaidGuild portal app.
- Make this app act as a light client launched from/passed off by the portal.
- Add role-based access if needed: viewer, editor, admin, agent.
- Add richer approval workflow: draft -> review -> approved -> scheduled -> published.
- Add webhooks for event changes.
- Add optional integration with a real scheduler such as Postiz or Mixpost.
- Add recurring publishing patterns.
- Add activity log and change history.

## Recommended Stack

- Framework: **Next.js App Router**
- Language: **TypeScript**
- Styling: **Tailwind CSS**
- Components: **shadcn/ui**
- Calendar: **React Big Calendar**
- Dates: **date-fns**
- Database access: **Drizzle ORM**
- Database for MVP: **Railway Postgres**
- Validation: **zod**
- API auth: static bearer token in `BARD_CALENDAR_AGENT_API_TOKEN`
- Deployment: **Railway**

## Database Choice

Use **Railway Postgres** from the start. The app is small enough that SQLite would work technically, but Postgres is the better default because it avoids persistent volume handling, supports normal Railway database backups/connection strings, leaves room for background jobs or multiple app instances later, and keeps production closer to the likely long-term shape.

Railway will provide a `DATABASE_URL` connection string for the Postgres service. The app should read it directly:

```env
DATABASE_URL=postgresql://...
```

Use Drizzle's Postgres adapter and SQL migrations. Keep schema definitions portable and conservative so local development can use either:

- a local Postgres container, recommended; or
- Railway's development environment/database connection.

## Environment Variables

```env
DATABASE_URL=postgresql://...
BARD_CALENDAR_AGENT_API_TOKEN=replace-with-long-random-token
NEXT_PUBLIC_APP_NAME=RaidGuild Content Calendar
```

Post-MVP auth variables can be added later once the SSO provider is known.

## Core Data Model

### `publishing_events`

```sql
create table publishing_events (
  id text primary key,
  name text not null,
  publish_at timestamptz not null,
  target_channel text not null,
  status text not null default 'planned',
  content_type text,
  campaign text,
  owner text,
  draft_url text,
  media_url text,
  live_url text,
  notes text,
  metadata_json jsonb not null default '{}'::jsonb,
  external_source text,
  external_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (external_source, external_id)
);
```

Use ISO 8601 UTC strings at the API boundary. Store timestamps as `timestamptz` in Postgres.

### Event Statuses

```ts
type PublishingStatus =
  | "idea"
  | "planned"
  | "drafting"
  | "ready"
  | "scheduled"
  | "published"
  | "skipped";
```

### Target Channels

Keep `target_channel` as a string in MVP so RaidGuild can add channels without migrations.

Expected initial values:

- `discord`
- `x`
- `linkedin`
- `mirror`
- `paragraph`
- `farcaster`
- `newsletter`
- `website`
- `other`

### Metadata

`metadata_json` is a flexible escape hatch for agent-generated context.

Example:

```json
{
  "persona": "RaidGuild",
  "priority": "normal",
  "source_brief_url": "https://...",
  "agent_notes": "Generated from weekly content brief."
}
```

## API Contract

All `/api/agent/*` endpoints require:

```http
Authorization: Bearer <BARD_CALENDAR_AGENT_API_TOKEN>
```

Return `401` when missing or invalid.

### `GET /api/events`

Public within MVP app. Used by UI calendar/list views.

Query params:

- `start` optional ISO date
- `end` optional ISO date
- `target_channel` optional
- `status` optional
- `owner` optional

Response:

```json
{
  "events": [
    {
      "id": "evt_...",
      "name": "Share weekly raid opportunities thread",
      "publish_at": "2026-07-01T16:00:00.000Z",
      "target_channel": "discord",
      "status": "planned",
      "content_type": "community_update",
      "campaign": "weekly-opps",
      "owner": "comms",
      "draft_url": "https://...",
      "media_url": "https://...",
      "live_url": null,
      "notes": "",
      "metadata": {},
      "external_source": "content-planner-agent",
      "external_id": "raidguild-week-27-discord-1",
      "created_at": "2026-06-11T18:00:00.000Z",
      "updated_at": "2026-06-11T18:00:00.000Z"
    }
  ]
}
```

### `POST /api/events`

Used by UI. Creates one event.

Body:

```json
{
  "name": "Share weekly raid opportunities thread",
  "publish_at": "2026-07-01T16:00:00.000Z",
  "target_channel": "discord",
  "status": "planned",
  "content_type": "community_update",
  "campaign": "weekly-opps",
  "owner": "comms",
  "draft_url": "https://...",
  "media_url": "https://...",
  "notes": ""
}
```

### `PATCH /api/events/:id`

Used by UI. Updates one event.

### `DELETE /api/events/:id`

Used by UI. Deletes one event.

### `POST /api/agent/events`

Agent-authenticated create endpoint. Same body as `POST /api/events`, with optional external identity fields.

### `PUT /api/agent/events/upsert`

Agent-authenticated upsert endpoint. If `external_source + external_id` already exists, update that event. Otherwise create a new event.

Required fields:

- `external_source`
- `external_id`
- `name`
- `publish_at`
- `target_channel`

Example:

```json
{
  "external_source": "content-planner-agent",
  "external_id": "raidguild-week-27-discord-1",
  "name": "Share weekly raid opportunities thread",
  "publish_at": "2026-07-01T16:00:00.000Z",
  "target_channel": "discord",
  "status": "planned",
  "content_type": "community_update",
  "campaign": "weekly-opps",
  "owner": "comms",
  "draft_url": "https://...",
  "media_url": "https://...",
  "metadata": {
    "persona": "RaidGuild",
    "priority": "normal"
  }
}
```

## UI Spec

### Layout

Use a simple app shell:

- Top bar with app name, date controls, and "New event" button.
- Main content area with tabs:
  - Calendar
  - List
- Right-side drawer or modal for event create/edit.

No marketing page. First screen should be the working calendar.

### Calendar View

Use React Big Calendar.

Required:

- Month view.
- Week view.
- Today / previous / next navigation.
- Event color by `target_channel` or `status`.
- Click empty slot to create event with prefilled date.
- Click event to edit.
- Drag/drop can be post-MVP unless cheap to enable safely.

Calendar event title format:

```txt
[channel] Event name
```

### List View

Use shadcn table or TanStack Table with shadcn components.

Columns:

- Publish date/time
- Name
- Channel
- Status
- Content type
- Campaign
- Owner
- Draft
- Media
- Updated

Filters:

- Date range
- Channel
- Status
- Owner
- Search by name/notes/campaign

### Event Form

Fields:

- Name, required text
- Publish date/time, required datetime
- Target channel, required select/combobox
- Status, required select
- Content type, optional text/select
- Campaign, optional text
- Owner, optional text
- Draft URL, optional URL
- Media URL, optional URL
- Live URL, optional URL
- Notes, optional textarea
- Metadata JSON, advanced optional textarea

Validation:

- Name cannot be blank.
- Publish date must parse as a valid date.
- URL fields must be valid URLs if present.
- Metadata JSON must parse if present.

## Suggested Routes

```txt
/
/api/events
/api/events/[id]
/api/agent/events
/api/agent/events/upsert
/api/health
```

`/api/health` returns:

```json
{ "ok": true }
```

## Suggested Project Structure

```txt
app/
  page.tsx
  api/
    events/
      route.ts
      [id]/
        route.ts
    agent/
      events/
        route.ts
        upsert/
          route.ts
    health/
      route.ts
components/
  app-shell.tsx
  calendar-view.tsx
  event-form.tsx
  event-drawer.tsx
  events-table.tsx
  filters.tsx
lib/
  api-auth.ts
  db/
    client.ts
    schema.ts
    migrations/
  events/
    queries.ts
    validation.ts
    mapping.ts
  dates.ts
```

## Implementation Notes

- Keep server-side DB code out of client components.
- Parse and validate request bodies with zod.
- Convert `metadata_json` to/from `metadata` at the API boundary.
- Use `crypto.randomUUID()` for event IDs, or a prefixed ID helper.
- Set `created_at` and `updated_at` in server code.
- Use UTC internally; display local time in the UI.
- Avoid adding auth assumptions to the UI. The app is intentionally unauthenticated for MVP.
- Do not expose `BARD_CALENDAR_AGENT_API_TOKEN` to client code.

## Railway Deployment Notes

- Add a Railway Postgres service to the project.
- Connect the Next.js web service to the Postgres service and expose `DATABASE_URL`.
- Railway Postgres provides `DATABASE_URL` along with `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, and `PGDATABASE`; prefer `DATABASE_URL` for Drizzle.
- Run Drizzle migrations during deploy/startup using a safe migration command such as `npm run db:migrate`.
- Do not require Railway volumes for the MVP.
- App replicas are possible later because the database is external to the web service. Keep replicas at 1 initially unless there is a clear need.
- Enable Railway database backups before using the app for real publishing operations.
- Add a health check against `/api/health`.

## Testing Requirements

Minimum:

- Unit tests for zod event validation.
- Unit tests for API auth helper.
- Unit tests for date range filtering/query helpers.
- API route tests for create, update, delete, and upsert.

Manual acceptance test:

1. Create an event from the UI.
2. See it on month and week calendar.
3. Edit status and channel.
4. Filter it in list view.
5. Upsert the same event through `/api/agent/events/upsert`.
6. Confirm it updates the existing event instead of creating a duplicate.
7. Restart the Railway service and confirm events persist in Postgres.

## MVP Acceptance Criteria

- A user can open `/` and immediately see a usable calendar.
- A user can create, edit, and delete publishing events.
- A user can filter events in a list view.
- An agent can create events with a static bearer token.
- An agent can idempotently upsert by `external_source + external_id`.
- Event data persists across Railway redeploys/restarts in Postgres.
- No auth is required for human UI in MVP.

## Open Questions

- Which RaidGuild portal SSO provider will eventually pass users into this app?
- Should initial events be public to anyone with the URL, or protected by a temporary shared secret/basic auth before SSO?
- What are the canonical channel names RaidGuild wants?
- Should event times default to a RaidGuild timezone, UTC, or the user's local timezone?
- Should agents be allowed to delete events, or only create/update/upsert?

## References

- [Railway Postgres](https://docs.railway.com/databases/postgresql)
- [React Big Calendar](https://github.com/jquense/react-big-calendar)
- [shadcn/ui](https://ui.shadcn.com/)
- [Drizzle ORM](https://orm.drizzle.team/)
