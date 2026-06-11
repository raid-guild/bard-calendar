# Raid Guild Social Content Calendar - Build Plan

Status: implementation plan  
Date: June 11, 2026  
Source spec: `social-content-calendar-custom-build-spec.md`  
Design reference: `../system-weaver`

## Build Objective

Build a lightweight internal social content calendar for Raid Guild using Next.js App Router, Railway Postgres, Drizzle, shadcn/ui, and React Big Calendar.

The app should open directly to the working calendar experience. Do not build a marketing page. The visual direction should come from `system-weaver`: dark operational UI, compact controls, Space Grotesk headings, Inter body text, JetBrains Mono labels, teal primary actions, hot-pink/accent highlights, thin borders, 4px radii, and the existing Tailwind CSS variable theme.

## Reference App Assets To Reuse

Copy or adapt these files from `system-weaver`:

```txt
system-weaver/src/index.css
system-weaver/tailwind.config.ts
system-weaver/components.json
system-weaver/src/app/layout.tsx
system-weaver/src/app/providers.tsx
system-weaver/src/lib/utils.ts
system-weaver/src/components/ui/*
```

Notes:

- `system-weaver` does not use `src/app/globals.css`; it imports `src/index.css` from `layout.tsx`.
- Update metadata in `layout.tsx` for the calendar app.
- Keep the `Providers` pattern so React Query, tooltips, and toasts are available app-wide.
- Use the `noise-bg` class sparingly on the app shell background.

## Visual Direction

The app should feel like an internal Raid Guild operations surface, not a landing page.

Use:

- `bg-background text-foreground font-sans antialiased`
- Sticky top bar with `bg-background/80 backdrop-blur-xl border-b border-border`
- `font-heading` for app title, section headings, buttons
- `font-mono text-xs uppercase tracking-[0.18em]` for labels, filters, and metadata
- Teal primary buttons
- Accent/pink highlights for notable states
- Compact dark panels with `border border-border`
- 4px radius from `--radius: 0.25rem`
- shadcn primitives for forms, tabs, tables, drawer/sheet, badges, tooltips, and buttons

Avoid:

- Hero sections
- Marketing copy
- Decorative card-heavy layout
- Oversized typography inside tool surfaces
- Nested cards
- One-note color treatment

## Phase 1: Project Foundation

1. Initialize or prepare the Next.js App Router project in `bard-calendar`.
2. Add TypeScript, Tailwind, shadcn/ui, and App Router conventions.
3. Bring over the styling/layout setup from `system-weaver`.
4. Install core dependencies:

```txt
next
react
react-dom
typescript
tailwindcss
tailwindcss-animate
lucide-react
class-variance-authority
clsx
tailwind-merge
@tanstack/react-query
react-hook-form
@hookform/resolvers
zod
react-big-calendar
date-fns
drizzle-orm
drizzle-kit
postgres
sonner
```

5. Add test tooling, likely:

```txt
vitest
@testing-library/react
@testing-library/jest-dom
```

## Phase 2: App Structure

Create this structure:

```txt
src/
  app/
    layout.tsx
    page.tsx
    providers.tsx
    api/
      health/
        route.ts
      events/
        route.ts
        [id]/
          route.ts
      agent/
        events/
          route.ts
          upsert/
            route.ts
  components/
    app-shell.tsx
    top-bar.tsx
    calendar-view.tsx
    events-table.tsx
    filters.tsx
    event-drawer.tsx
    event-form.tsx
    status-badge.tsx
    channel-badge.tsx
    ui/
  hooks/
  lib/
    api-auth.ts
    dates.ts
    utils.ts
    db/
      client.ts
      schema.ts
      migrations/
    events/
      queries.ts
      validation.ts
      mapping.ts
      constants.ts
  index.css
```

## Phase 3: Database And Schema

Use Railway Postgres from the start.

Implement `publishing_events` with:

```sql
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
```

Implementation notes:

- Use Drizzle schema definitions.
- Use SQL migrations.
- Read `DATABASE_URL` from the environment.
- Store timestamps as `timestamptz`.
- Use ISO 8601 UTC strings at the API boundary.
- Use `crypto.randomUUID()` with an `evt_` prefix helper.
- Map `metadata_json` in the database to `metadata` in API responses.

## Phase 4: Validation And Domain Helpers

Create zod schemas for:

- Event create input
- Event update input
- Agent create input
- Agent upsert input
- Event list query filters
- Metadata JSON parsing

Supported statuses:

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

Initial target channels:

```txt
discord
x
linkedin
mirror
paragraph
farcaster
newsletter
website
other
```

Keep `target_channel` as a string so new channels do not require migrations.

## Phase 5: API Routes

Build:

```txt
GET    /api/health
GET    /api/events
POST   /api/events
PATCH  /api/events/[id]
DELETE /api/events/[id]
POST   /api/agent/events
PUT    /api/agent/events/upsert
```

Route behavior:

- `GET /api/health` returns `{ "ok": true }`.
- `GET /api/events` supports `start`, `end`, `target_channel`, `status`, and `owner`.
- `POST /api/events` creates one UI event.
- `PATCH /api/events/[id]` updates one event.
- `DELETE /api/events/[id]` deletes one event.
- `POST /api/agent/events` creates one agent event with bearer-token auth.
- `PUT /api/agent/events/upsert` updates or creates based on `external_source + external_id`.

Agent auth:

- Require `Authorization: Bearer <BARD_CALENDAR_AGENT_API_TOKEN>`.
- Return `401` when missing or invalid.
- Never expose `BARD_CALENDAR_AGENT_API_TOKEN` to client code.

## Phase 6: UI Shell

Build a compact app shell:

- Top bar with app name, date controls, and `New event`.
- Main area with `Calendar` and `List` tabs.
- Right-side drawer/sheet for create/edit.
- Toasts for create, update, delete, and API errors.

Top bar controls:

- Today
- Previous
- Next
- Current visible range label
- New event button with icon

Use lucide icons where appropriate:

- `CalendarDays`
- `Plus`
- `ChevronLeft`
- `ChevronRight`
- `ListFilter`
- `Search`
- `ExternalLink`
- `Trash2`
- `Save`

## Phase 7: Calendar View

Use React Big Calendar with `date-fns` localizer.

Required:

- Month view
- Week view
- Today / previous / next navigation
- Click empty slot to create event with prefilled date
- Click event to edit
- Event title format: `[channel] Event name`
- Event color by status or channel

Recommended:

- Color primarily by `status`.
- Show channel in the label/badge.
- Defer drag/drop until post-MVP unless it is cheap and safe to enable.
- Add CSS overrides so React Big Calendar matches the `system-weaver` dark theme.

## Phase 8: List View

Use shadcn `Table` first. Add TanStack Table later only if sorting, column state, or pagination becomes necessary.

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
- Search by name, notes, and campaign

Keep filters in a compact toolbar above the table.

## Phase 9: Event Drawer And Form

Use a right-side shadcn `Sheet` or `Drawer`.

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

Form behavior:

- Create mode pre-fills date when opened from a calendar slot.
- Edit mode loads existing event data.
- Delete action asks for confirmation.
- Submit closes drawer only after successful API response.
- Use optimistic refetch or React Query invalidation after mutations.

## Phase 10: Testing

Minimum tests:

- zod event validation
- API auth helper
- Date range filtering/query helpers
- API create route
- API update route
- API delete route
- Agent upsert route

Manual acceptance test:

1. Create an event from the UI.
2. See it on month and week calendar.
3. Edit status and channel.
4. Filter it in list view.
5. Upsert the same event through `/api/agent/events/upsert`.
6. Confirm it updates the existing event instead of creating a duplicate.
7. Restart the Railway service and confirm events persist in Postgres.

## Phase 11: Railway Deployment

Environment variables:

```env
DATABASE_URL=postgresql://...
BARD_CALENDAR_AGENT_API_TOKEN=replace-with-long-random-token
NEXT_PUBLIC_APP_NAME=Raid Guild Content Calendar
```

Recommended scripts:

```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint .",
  "test": "vitest",
  "db:generate": "drizzle-kit generate",
  "db:migrate": "drizzle-kit migrate"
}
```

Railway setup:

- Add a Railway Postgres service.
- Connect the Next.js web service to Postgres.
- Prefer `DATABASE_URL`.
- Run migrations during deploy or release.
- Set health check to `/api/health`.
- Keep replicas at 1 initially.
- Enable database backups before real publishing operations.

## Implementation Order

1. Bootstrap `bard-calendar` with Next.js, Tailwind, shadcn, and copied `system-weaver` styling.
2. Add Drizzle schema, db client, and initial migration.
3. Add event constants, zod validation, and mapping helpers.
4. Build API auth helper.
5. Build `/api/health`.
6. Build `/api/events` list/create.
7. Build `/api/events/[id]` update/delete.
8. Build agent create and upsert routes.
9. Build app shell and top bar.
10. Build React Big Calendar month/week view.
11. Build event drawer/form.
12. Build list/table view with filters.
13. Add tests.
14. Run local acceptance test.
15. Prepare Railway deployment.

## MVP Acceptance Criteria

- A user can open `/` and immediately see a usable calendar.
- A user can create, edit, and delete publishing events.
- A user can filter events in a list view.
- An agent can create events with a static bearer token.
- An agent can idempotently upsert by `external_source + external_id`.
- Event data persists across Railway redeploys/restarts in Postgres.
- No auth is required for human UI in MVP.

## Post-MVP Parking Lot

- Portal SSO.
- Role-based access.
- Approval workflow beyond status.
- Webhooks for event changes.
- Postiz or Mixpost integration.
- Recurring publishing patterns.
- Activity log and change history.
- Agent delete endpoint, if needed.
- Drag/drop calendar rescheduling.
