# Raid Guild Content Calendar

Lightweight internal social content calendar for Raid Guild publishing plans, drafts, media links, statuses, channel targets, and agent-created events.

The app is a Next.js App Router build using the `system-weaver` Raid Guild visual system: dark operational UI, compact shadcn controls, Space Grotesk headings, Inter body text, JetBrains Mono labels, teal primary actions, and sharp 4px radii.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- React Big Calendar
- date-fns
- Drizzle ORM
- PostgreSQL
- zod
- Vitest

## Setup

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env
```

Set:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/raidguild_calendar
BARD_CALENDAR_AGENT_API_TOKEN=replace-with-long-random-token
NEXT_PUBLIC_APP_NAME=Raid Guild Content Calendar
```

Run migrations:

```bash
npm run db:migrate
```

Start the app:

```bash
npm run dev
```

If your machine hits the Linux file watcher limit with `next dev`, use the production server instead:

```bash
npm run build
npm start
```

## Scripts

```bash
npm run dev          # Start Next dev server
npm run build        # Production build
npm start            # Start production server
npm run lint         # ESLint
npm test             # Vitest test suite
npm run db:generate  # Generate Drizzle migrations
npm run db:migrate   # Apply Drizzle migrations
```

## API

Human UI endpoints:

```txt
GET    /api/events
POST   /api/events
PATCH  /api/events/:id
DELETE /api/events/:id
```

Agent endpoints:

```txt
GET   /api/agent/events
POST  /api/agent/events
PATCH /api/agent/events/:id
PUT   /api/agent/events/upsert
```

Agent endpoints require:

```http
Authorization: Bearer <BARD_CALENDAR_AGENT_API_TOKEN>
```

See `AGENT.md` for supported filters, request examples, and response shape.

Health check:

```txt
GET /api/health
```

## Database

The main table is `publishing_events`.

Migration files live in:

```txt
src/lib/db/migrations
```

The app expects PostgreSQL in local development and Railway Postgres in production.

## Notes

- The MVP UI is intentionally unauthenticated.
- `BARD_CALENDAR_AGENT_API_TOKEN` must never be exposed to client code.
- Event timestamps are accepted as ISO 8601 strings at the API boundary and stored as `timestamptz`.
- The calendar supports month and week views.
