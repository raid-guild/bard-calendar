# Agent API

This app exposes authenticated endpoints for planner and creator agents to manage content topics, drafts, and publishing events.

All `/api/agent/*` requests require:

```http
Authorization: Bearer <BARD_CALENDAR_AGENT_API_TOKEN>
```

Set `BARD_CALENDAR_AGENT_API_TOKEN` in the deployment environment. Do not expose it to browser/client code.

## Content Model

The content workflow is:

```txt
topic -> draft -> publishing event -> live URL / performance data
```

Topics represent the underlying idea or theme. Drafts belong to topics and hold channel-specific markdown copy. Publishing events are scheduled calendar items. Events can link back to a `topic_id`, a `draft_id`, or both.

Use explicit links whenever possible:

```txt
content_topics.id       -> content_drafts.topic_id
content_topics.id       -> publishing_events.topic_id
content_drafts.id       -> publishing_events.draft_id
publishing_events.live_url stores the published post URL
```

That relationship is what makes later questions like “which topics are performing well?” queryable without guessing from titles or URLs.

## Topics

Topics can store supporting material as markdown. This can include notes, context, source excerpts, and plain URLs.

Topic fields:

```txt
id
title
supporting_material_markdown
status                  active | archived
created_by
metadata
external_source
external_id
draft_count
created_at
updated_at
```

## Fetch Topics

```http
GET /api/agent/topics
```

Supported query filters:

```txt
status  active | archived
search  partial match against title or supporting material
```

## Create Topic

```http
POST /api/agent/topics
```

Required fields:

```txt
title
```

Optional fields:

```txt
supporting_material_markdown
status
created_by
metadata
external_source
external_id
```

Example:

```bash
curl -X POST "https://calendar.example.com/api/agent/topics" \
  -H "Authorization: Bearer $BARD_CALENDAR_AGENT_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Agent-assisted onboarding stories",
    "supporting_material_markdown": "Links, notes, interview snippets, and strategic context.",
    "external_source": "content-agent",
    "external_id": "topic-onboarding-stories"
  }'
```

## Upsert Topic

```http
PUT /api/agent/topics/upsert
```

Creates or updates one topic by `external_source + external_id`.

Required fields:

```txt
external_source
external_id
title
```

Use this when an agent may regenerate or revise a topic and needs idempotent writes.

## Get, Update, Or Delete Topic

```http
GET    /api/agent/topics/{id}
PATCH  /api/agent/topics/{id}
DELETE /api/agent/topics/{id}
```

`PATCH` accepts any topic create field as an optional partial update.

## Drafts

Drafts belong to topics and are channel-specific.

Draft fields:

```txt
id
topic_id
title
target_channel
markdown_content
external_draft_url
status                  draft | ready | assigned | published | archived
created_by
metadata
external_source
external_id
dagger_count
user_has_dagger
assigned_event_id
assigned_publish_at
live_url
created_at
updated_at
```

Daggers are human approval/upvote signals displayed as `🗡️` in the UI. Agents can read dagger counts but should not normally create daggers.

## Fetch Drafts

```http
GET /api/agent/drafts
```

Supported query filters:

```txt
topic_id
target_channel
status          draft | ready | assigned | published | archived
search          partial match against draft title or markdown content
```

## Create Draft

```http
POST /api/agent/drafts
```

Required fields:

```txt
topic_id
title
target_channel
```

Optional fields:

```txt
markdown_content
external_draft_url
status
created_by
metadata
external_source
external_id
```

Example:

```bash
curl -X POST "https://calendar.example.com/api/agent/drafts" \
  -H "Authorization: Bearer $BARD_CALENDAR_AGENT_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "topic_id": "top_...",
    "title": "Onboarding story thread",
    "target_channel": "x: main account",
    "markdown_content": "Draft copy in markdown.",
    "external_source": "content-agent",
    "external_id": "draft-onboarding-x-thread"
  }'
```

## Upsert Draft

```http
PUT /api/agent/drafts/upsert
```

Creates or updates one draft by `external_source + external_id`.

Required fields:

```txt
external_source
external_id
topic_id
title
target_channel
```

## Get, Update, Or Delete Draft

```http
GET    /api/agent/drafts/{id}
PATCH  /api/agent/drafts/{id}
DELETE /api/agent/drafts/{id}
```

`PATCH` accepts any draft create field as an optional partial update.

## Assign Draft To Calendar

```http
POST /api/agent/drafts/{id}/assign-event
```

Creates a publishing event linked to the draft and its topic. The draft status becomes `assigned`.

Required fields:

```txt
publish_at
```

Optional fields:

```txt
name
status
content_type
campaign
owner
media_url
live_url
notes
metadata
```

If `name` is omitted, the draft title is used. The created event inherits the draft channel and external draft URL.

Example:

```bash
curl -X POST "https://calendar.example.com/api/agent/drafts/drf_.../assign-event" \
  -H "Authorization: Bearer $BARD_CALENDAR_AGENT_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "publish_at": "2026-07-01T16:00:00.000Z",
    "status": "planned",
    "owner": "comms"
  }'
```

## Publishing Events

Publishing events are calendar items. They can be created directly, or generated from a draft with the assign endpoint.

Event fields:

```txt
id
name
publish_at
target_channel
status                  idea | planned | drafting | ready | scheduled | published | skipped
content_type
campaign
owner
draft_url
media_url
live_url
topic_id
draft_id
notes
metadata
external_source
external_id
created_at
updated_at
```

When a post goes live, update `live_url` on the publishing event. Keep `topic_id` and `draft_id` attached so performance analysis can roll up from published URLs to drafts and topics.

## Fetch Events

```http
GET /api/agent/events
```

Supported query filters:

```txt
start           ISO 8601 datetime, inclusive lower bound for publish_at
end             ISO 8601 datetime, inclusive upper bound for publish_at
status          idea | planned | drafting | ready | scheduled | published | skipped
target_channel  x: main account | x: raida | linkedin | paragraph | farcaster | newsletter | website: .ia | website: .org | website: raida | discord | other, or any custom channel string
owner           exact owner match
name            partial match against event name
search          partial match against name, notes, or campaign
topic_id        exact topic id
draft_id        exact draft id
```

## Create Event

```http
POST /api/agent/events
```

Required fields:

```txt
name
publish_at
target_channel
```

Optional fields:

```txt
status
content_type
campaign
owner
draft_url
media_url
live_url
topic_id
draft_id
notes
metadata
external_source
external_id
```

## Upsert Event

```http
PUT /api/agent/events/upsert
```

Creates or updates one event by `external_source + external_id`.

Required fields:

```txt
external_source
external_id
name
publish_at
target_channel
```

Use this endpoint when an agent may regenerate a plan and needs idempotent writes.

## Update Event

```http
PATCH /api/agent/events/{id}
```

Updates one existing event by calendar event `id`. Send only the fields that should change.

Example:

```bash
curl -X PATCH "https://calendar.example.com/api/agent/events/evt_..." \
  -H "Authorization: Bearer $BARD_CALENDAR_AGENT_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "published",
    "live_url": "https://example.com/published-post"
  }'
```

## Status Codes

```txt
200  Request succeeded
201  Resource created
400  Invalid request body or query
401  Missing or invalid bearer token
404  Resource not found
```

## Timestamp Rules

- Send `publish_at`, `start`, and `end` as ISO 8601 strings.
- Use UTC at the API boundary when possible.
- The database stores timestamps as PostgreSQL `timestamptz`.
