# Agent API

This app exposes a small authenticated API for planner and creator agents.

All `/api/agent/*` requests require:

```http
Authorization: Bearer <AGENT_API_TOKEN>
```

Set `AGENT_API_TOKEN` in the deployment environment. Do not expose it to browser/client code.

## Fetch Events

```http
GET /api/agent/events
```

Returns publishing events visible to the agent.

Supported query filters:

```txt
start           ISO 8601 datetime, inclusive lower bound for publish_at
end             ISO 8601 datetime, inclusive upper bound for publish_at
status          idea | planned | drafting | ready | scheduled | published | skipped
target_channel  discord | x | linkedin | mirror | paragraph | farcaster | newsletter | website | other, or any custom channel string
owner           exact owner match
name            partial match against event name
search          partial match against name, notes, or campaign
```

Example:

```bash
curl "https://calendar.example.com/api/agent/events?start=2026-07-01T00:00:00.000Z&end=2026-07-31T23:59:59.999Z&status=planned&target_channel=discord&name=weekly" \
  -H "Authorization: Bearer $AGENT_API_TOKEN"
```

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

## Create Event

```http
POST /api/agent/events
```

Creates one event.

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
notes
metadata
external_source
external_id
```

Example:

```bash
curl -X POST "https://calendar.example.com/api/agent/events" \
  -H "Authorization: Bearer $AGENT_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Share weekly raid opportunities thread",
    "publish_at": "2026-07-01T16:00:00.000Z",
    "target_channel": "discord",
    "status": "planned",
    "content_type": "community_update",
    "campaign": "weekly-opps",
    "owner": "comms",
    "draft_url": "https://example.com/draft",
    "metadata": {
      "persona": "Raid Guild",
      "priority": "normal"
    },
    "external_source": "content-planner-agent",
    "external_id": "raidguild-week-27-discord-1"
  }'
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

Example:

```bash
curl -X PUT "https://calendar.example.com/api/agent/events/upsert" \
  -H "Authorization: Bearer $AGENT_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "external_source": "content-planner-agent",
    "external_id": "raidguild-week-27-discord-1",
    "name": "Share weekly raid opportunities thread",
    "publish_at": "2026-07-01T16:00:00.000Z",
    "target_channel": "discord",
    "status": "planned"
  }'
```

## Update Event

```http
PATCH /api/agent/events/{id}
```

Updates one existing event by calendar event `id`. Use this endpoint when the event already exists in the app, especially for human-created events that do not have stable `external_source + external_id`.

Send only the fields that should change.

Optional fields:

```txt
name
publish_at
target_channel
status
content_type
campaign
owner
draft_url
media_url
live_url
notes
metadata
external_source
external_id
```

Example:

```bash
curl -X PATCH "https://calendar.example.com/api/agent/events/evt_..." \
  -H "Authorization: Bearer $AGENT_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "drafting",
    "draft_url": "https://example.com/draft"
  }'
```

Use `PUT /api/agent/events/upsert` only when the agent has a stable `external_source + external_id` and wants idempotent create-or-update behavior.

## Status Codes

```txt
200  Request succeeded
201  Event created
400  Invalid request body or query
401  Missing or invalid bearer token
404  Event not found
```

## Timestamp Rules

- Send `publish_at`, `start`, and `end` as ISO 8601 strings.
- Use UTC at the API boundary when possible.
- The database stores timestamps as PostgreSQL `timestamptz`.
