# Newsletter Scheduling In Bard Calendar - Future Feature Spec

Status: proposed future feature

Date: July 21, 2026

Primary surface: Bard Calendar Topic detail page and publishing calendar

Source system: RaidGuild Portal posts

Delivery system: listmonk with SendGrid SMTP

## Summary

Move the operator-facing Portal newsletter workflow into Bard Calendar so email distribution can be reviewed and scheduled alongside X, LinkedIn, Discord, and other channel outputs.

Bard should own editorial coordination, approvals, requested schedules, and the human-readable projection of delivery state. Portal should remain the canonical source for long-form posts and initially retain the deterministic Portal-post-to-email renderer and listmonk adapter. listmonk should continue to own subscribers, lists, unsubscribes, suppression, campaign execution, and delivery analytics. SendGrid remains transport infrastructure behind listmonk.

```txt
Portal post
  -> Bard Topic
    -> Newsletter Draft
      -> Bard Publishing Event
        -> Portal newsletter adapter
          -> listmonk campaign
            -> SendGrid SMTP
```

This feature should build on the proposed content distribution bundle workspace rather than create a separate newsletter application inside Bard.

## Product Decision

Bard Calendar becomes the central content scheduling and review surface, including newsletters.

Do not move subscriber management, unsubscribe handling, bounce processing, suppression rules, or SMTP configuration into Bard. Do not rewrite the existing Portal newsletter integration before Bard can use it through a scoped server-to-server contract.

The transition should be incremental:

1. Represent newsletters as Bard Drafts and Publishing Events.
2. Integrate Bard with the existing Portal newsletter backend.
3. Reach feature parity for campaign draft creation and test sends.
4. Add listmonk scheduling and delivery reconciliation.
5. Replace the Portal newsletter UI with a deep link into Bard when the Bard workflow is dependable.
6. Consider extracting the Portal renderer/adapter into a shared service only after the integration boundary is proven.

## Goals

- Review email and social artifacts together under one Topic.
- Schedule newsletters on the same calendar as other publishing events.
- Create or update listmonk campaign drafts from Portal posts.
- Select only allowlisted listmonk audiences.
- Preview subject, preheader, HTML, and plain text before sending.
- Send test emails and record their result.
- Require explicit human approval before scheduling or sending.
- Record listmonk campaign identity and provider state in Bard.
- Reconcile scheduled, running, sent, failed, and archived states back into Bard.
- Preserve listmonk's unsubscribe and suppression behavior.
- Allow Prism to generate and audit newsletter content without granting it publication authority.

## Non-Goals For The First Integration

- Replacing listmonk with Bard.
- Sending bulk email directly through SendGrid.
- Editing subscriber records in Bard.
- Importing arbitrary contact lists through Bard.
- Building a general marketing automation or drip-campaign system.
- Moving Portal post authoring into Bard.
- Automatically sending an email when generation completes.
- Making an LLM responsible for audience eligibility or final send authorization.
- Reproducing all listmonk analytics in the first release.

## Existing Capabilities To Reuse

The Portal newsletter implementation already supports important deterministic behavior:

- Search and select Portal posts, including latest saved drafts.
- Render Portal Lexical post content into email-safe HTML and plain text.
- Apply the reusable listmonk campaign template.
- Set subject and preheader.
- Restrict selection to configured allowlisted list IDs.
- Create or update a listmonk campaign draft.
- Send test messages.
- Store a Portal `newsletterCampaigns` record with listmonk identifiers, sync timestamps, test state, and errors.
- Link administrators to the listmonk campaign.

The first Bard integration should call this behavior through a scoped server API rather than duplicate the renderer and listmonk client.

The `portal-newsletter` repository remains the operational home for the listmonk deployment, template, SendGrid SMTP setup, deliverability checks, and integration runbooks.

## System Ownership

| System | Owns |
| --- | --- |
| Portal | Canonical post, saved and published revisions, authorship, visibility, Lexical content, and Portal media |
| Bard Topic | Content bundle identity and relationship between the Portal post and all distribution artifacts |
| Bard Newsletter Draft | Editable email artifact, subject, preheader, content, template selection, audit state, and asset references |
| Bard Publishing Event | Audience intent, requested send time, approval, external campaign reference, and projected delivery state |
| Portal newsletter adapter | Deterministic post rendering, list allowlist enforcement, listmonk API calls, and Portal campaign audit record |
| listmonk | Subscriber lists, subscriptions, unsubscribes, blocklists, bounces, campaign scheduling, execution, archives, and analytics |
| SendGrid | SMTP transport and deliverability infrastructure behind listmonk |
| Prism | Content generation, subject/preheader variants, image generation, and content/link/CTA audits |

## Content Model

### Topic

One Bard Topic represents the source Portal post and contains every social and email artifact derived from it.

```txt
external_source = portal-post
external_id     = <Portal post ID>
```

### Newsletter Draft

Create a normal Bard Draft with:

```txt
target_channel = newsletter
external_source = portal-newsletter
external_id = portal-post:<post-id>:newsletter
```

The Draft's markdown content contains the editable email body or editorial representation. Newsletter-specific structured fields may begin in metadata but should become first-class fields or a related record once the workflow is established.

Suggested newsletter artifact data:

```txt
subject
preheader
body_markdown
rendered_html_artifact_id
rendered_text_artifact_id
template_id
source_mode             latest_saved_draft | published
source_revision
generated_content_hash
audit_status
approved_at
approved_by
```

### Publishing Event

A Newsletter Draft can be attached to one or more Publishing Events. Audience and send timing belong to the Event, because one email artifact may be tested, segmented, or sent to different lists at different times.

Suggested newsletter delivery data:

```txt
list_ids
audience_label
estimated_recipient_count
from_email
requested_send_at
test_status
last_test_email
last_test_sent_at
approval_status
listmonk_campaign_id
listmonk_campaign_uuid
listmonk_campaign_url
provider_status
provider_scheduled_at
provider_sent_at
archive_url
last_synced_at
last_error
```

The generic Publishing Event status remains the calendar-facing projection:

```txt
planned -> drafting -> ready -> scheduled -> published
```

Provider-specific state should remain separately visible so Bard does not claim an email was scheduled or sent without listmonk evidence.

## Primary UX

### Topic Detail Page

The dedicated Topic detail page is the primary editorial workspace. Newsletter should appear beside other channel Drafts, but use a specialized card or expanded panel because email requires more information than a social post.

The Newsletter panel should show:

- Subject and preheader.
- Source mode: latest saved Portal draft or published post.
- Email body preview.
- Rendered HTML and plain-text status.
- Template identity.
- Source revision and stale-source warning.
- CTA, link, attribution, and image audit.
- Selected header/inline images.
- Approval status.
- Audience selection summary.
- Test-send state.
- Current listmonk campaign reference.
- Requested and provider-confirmed schedule.
- Delivery status and latest error.

Primary actions:

- Generate or regenerate through Prism.
- Edit Draft.
- Preview email.
- Sync campaign draft to listmonk.
- Send test.
- Select audience.
- Approve.
- Schedule email.
- Open in listmonk.

### Email Preview

Provide separate preview modes:

- Desktop HTML.
- Narrow/mobile HTML.
- Plain text.
- Link and tracking summary.

The preview should use the deterministic rendered output from the newsletter adapter, not an approximation produced independently in the browser.

External content must be sandboxed when rendering an HTML preview. Do not allow arbitrary generated HTML to execute scripts in the Bard origin.

### Audience Selection

Display only lists returned by the allowlisted newsletter adapter contract.

For each list show:

- List name.
- List ID.
- Subscriber count.
- List type when available.
- Optional policy description.

The UI should display an estimated combined audience but avoid promising an exact recipient count. listmonk suppression, blocklists, and unsubscribe state determine actual delivery eligibility.

Do not allow free-form recipient uploads or arbitrary list IDs through this surface.

### Test Send

Test sending should require:

- A successfully synced listmonk campaign draft.
- A validated test recipient.
- The latest rendered artifact to be synced.

Record:

- Test recipient.
- Test timestamp.
- Campaign revision/source revision.
- Success or failure.
- Provider error when present.

A newer source or Draft revision should mark the previous test as stale.

### Approval And Scheduling

Scheduling should remain unavailable until:

- The Newsletter Draft is ready.
- The source revision is current or the stale warning is explicitly resolved.
- At least one allowlisted audience is selected.
- A listmonk campaign draft exists.
- A test has been sent for the current rendered revision, if required by policy.
- A human with sufficient permission approves the send.

The confirmation dialog should clearly state:

```txt
Subject
Audience lists
Estimated recipients
From address
Requested send time and timezone
Portal source
listmonk campaign ID
Approving user
```

No generation action should imply approval to schedule or send.

### Calendar And List Views

Newsletter events should appear alongside other channel events with enough audience context to distinguish them:

```txt
Jul 28, 2026 9:00 AM
Newsletter: ECWireless kickoff
RG Updates · approximately 1,842 subscribers · Scheduled
```

The event drawer should include a Newsletter section when `target_channel` is `newsletter`:

- Audience lists.
- Estimated audience.
- Test status.
- Approval state.
- Provider schedule.
- listmonk campaign link.
- Last reconciliation time.
- Error/retry information.

## Integration Architecture

### Initial Boundary

```txt
Bard browser
  -> Bard server routes
    -> scoped Portal newsletter integration routes
      -> existing Portal renderer and listmonk client
        -> listmonk API
```

Browser code must never receive Portal integration, listmonk, or SendGrid credentials.

Bard verifies its local Portal-launched session before accepting newsletter mutations. Bard then calls the Portal newsletter adapter with server-to-server authentication.

### Suggested Portal Integration Routes

```http
GET  /api/integrations/bard-calendar/newsletter/lists
POST /api/integrations/bard-calendar/newsletter/render
POST /api/integrations/bard-calendar/newsletter/campaigns/upsert
POST /api/integrations/bard-calendar/newsletter/campaigns/{id}/test
POST /api/integrations/bard-calendar/newsletter/campaigns/{id}/schedule
POST /api/integrations/bard-calendar/newsletter/campaigns/{id}/cancel
GET  /api/integrations/bard-calendar/newsletter/campaigns/{id}
```

These routes should expose newsletter operations, not general Portal or listmonk administration.

The adapter must continue to enforce:

- Portal content permissions.
- Allowed source modes.
- Allowlisted list IDs.
- Configured sender and template restrictions.
- Idempotency for campaign creation/update.
- Explicit authorization for schedule, cancel, or send operations.

### Bard Routes

Suggested Bard-owned routes:

```http
GET  /api/topics/{id}/newsletter
POST /api/topics/{id}/newsletter/render
POST /api/drafts/{id}/newsletter/sync
POST /api/drafts/{id}/newsletter/test
POST /api/events/{id}/newsletter/schedule
POST /api/events/{id}/newsletter/cancel
POST /api/events/{id}/newsletter/reconcile
```

The Bard API should translate provider results into the Bard Draft/Event projection while retaining external identifiers and raw provider status in structured metadata.

## Scheduling And Reconciliation

Bard owns the requested schedule; listmonk owns the effective provider schedule.

Scheduling should be treated as successful only after listmonk confirms the campaign schedule. Store both timestamps when they differ.

Recommended schedule flow:

1. Lock the approved Draft revision and source revision.
2. Re-render and sync the exact approved content if required.
3. Confirm selected lists remain allowlisted.
4. Request listmonk scheduling with an idempotency key.
5. Save the listmonk campaign identity and confirmed schedule.
6. Update the Bard Event to `scheduled`.
7. Periodically reconcile provider state.
8. Mark the Event `published` only when listmonk reports completion/sent state.
9. Store the archive URL and sent timestamp when available.

Reconciliation should handle:

- Schedule changed in listmonk.
- Campaign canceled in listmonk.
- Campaign already sent.
- Partial or failed send.
- Campaign missing or deleted.
- Bard retry after a timeout where listmonk may have accepted the operation.

All mutating provider calls need stable idempotency and reconciliation logic. A network timeout must not lead to duplicate campaigns or sends.

## Prism's Role

Prism may:

- Generate subject and preheader variants.
- Adapt a Portal post into newsletter body copy.
- Generate header and inline images.
- Audit CTA, claims, attribution, links, tone, and accessibility hints.
- Produce a machine-readable email artifact manifest.
- Post the generated Newsletter Draft back into Bard under the Topic.

Prism must not:

- Add subscribers to lists.
- Choose an audience without a human-selected policy-bound input.
- Bypass list allowlists.
- Approve a production send.
- Directly send through SendGrid.
- Treat generation completion as publication authority.

If Prism participates in scheduling orchestration, the final provider operation should be a deterministic command/adapter step gated by explicit approval.

## SendGrid Boundary

SendGrid is not a Bard distribution option. It is the SMTP transport configured inside listmonk.

Bard may surface a concise delivery or configuration error originating from SendGrid, but it should not expose:

- SendGrid API keys.
- SMTP credentials.
- Sender authentication administration.
- Suppression-group management.
- Direct bulk-send controls.

Deliverability checks, authenticated-domain configuration, sender verification, and SMTP setup remain operational concerns in the `portal-newsletter` repository and listmonk administration.

## Migration From The Portal Newsletter UI

### Phase 1: Read Projection

- Show existing Portal/listmonk campaign identity and state in Bard.
- Link a Bard Topic to the Portal post and existing newsletter campaign.
- Display campaign/listmonk links without changing provider state.

### Phase 2: Draft And Preview

- Create a Newsletter Draft under the Topic.
- Render HTML/text through the existing Portal adapter.
- Display previews and source revision.
- Add Prism generation and audit references when available.

### Phase 3: Sync And Test

- Load allowlisted listmonk audiences.
- Create/update a listmonk campaign draft from Bard.
- Send tests and record their state.
- Implement human-edit and stale-source safeguards.

### Phase 4: Central Scheduling

- Add newsletter fields to Publishing Events.
- Add approval and schedule confirmation.
- Extend the adapter for listmonk schedule/cancel operations.
- Reconcile listmonk state back into Bard.
- Display newsletters in Calendar and List views.

### Phase 5: Portal UI Handoff

- Change the Portal post Newsletter action to open or create the corresponding Bard Topic.
- Preserve a Portal admin fallback for operational recovery.
- Stop presenting two competing editorial newsletter workspaces.

### Phase 6: Optional Adapter Extraction

- Evaluate extracting Portal rendering and listmonk calls into a small shared service or package.
- Preserve Portal's source/content authorization contract.
- Migrate only if the extraction improves ownership and deployment without weakening security or duplicating state.

## Data Model Strategy

For an initial spike, newsletter-specific fields may live in Draft and Event metadata. This is suitable for proving the integration but not ideal for filtering, scheduling, and reconciliation.

Once the shape stabilizes, prefer first-class related records such as:

```txt
newsletter_artifacts
  id
  draft_id
  subject
  preheader
  source_mode
  source_revision
  template_id
  rendered_html_artifact_id
  rendered_text_artifact_id
  approved_at
  approved_by
  metadata_json
  created_at
  updated_at

newsletter_deliveries
  id
  event_id
  newsletter_artifact_id
  audience_label
  list_ids_json
  estimated_recipient_count
  from_email
  test_status
  last_test_email
  last_test_sent_at
  listmonk_campaign_id
  listmonk_campaign_uuid
  listmonk_campaign_url
  provider_status
  provider_scheduled_at
  provider_sent_at
  archive_url
  last_synced_at
  last_error
  metadata_json
  created_at
  updated_at
```

Do not copy subscriber rows into Bard.

## Authorization And Safety

- Viewing follows Bard Topic/Event view permissions.
- Rendering and preview require Bard edit permission.
- Syncing and testing require an editor-level newsletter permission.
- Scheduling, canceling, and production sending require a stronger explicit permission or approval policy.
- Service credentials remain server-side.
- Audience IDs must be validated by the adapter, not trusted from browser input.
- HTML previews must be sandboxed.
- Log actor, Draft revision, source revision, audience IDs, provider campaign ID, and idempotency key for consequential operations.
- Never log subscriber addresses, API tokens, SMTP credentials, or full suppression data.

## OpenAPI And Agent Documentation

Document newsletter endpoints in the planned Bard OpenAPI specification.

Extend `AGENT.md` with:

- Newsletter Draft identity rules.
- Newsletter artifact versus delivery-event ownership.
- Allowed audience/list behavior.
- Render, sync, test, approve, schedule, and reconcile contracts.
- Explicit prohibition against treating generation as send authorization.
- Idempotency and external campaign reconciliation requirements.
- Example Portal post, Bard Draft, Bard Event, and listmonk campaign mapping.

## Acceptance Criteria For A First End-To-End Newsletter Slice

- An authorized Bard editor can open a Topic linked to a Portal post.
- The Topic displays a specialized Newsletter Draft panel.
- Bard can request deterministic HTML and text rendering for the current Portal source revision.
- The editor can preview subject, preheader, HTML, and plain text.
- Bard can display allowlisted listmonk lists and subscriber-count estimates.
- Bard can create or update one idempotent listmonk campaign draft.
- Bard records the listmonk campaign ID, URL, sync time, and errors.
- The editor can send a test and see whether it matches the current Draft revision.
- A Newsletter Publishing Event appears in Calendar and List views.
- Scheduling is blocked without current content, audience selection, and explicit approval.
- A confirmed listmonk schedule updates the Bard Event to `scheduled`.
- Reconciliation can mark the Event published/sent or surface a provider failure.
- No listmonk or SendGrid credentials reach browser code.
- No subscriber rows are copied into Bard.

## Open Questions

- Should newsletter send approval use a dedicated role, one dagger, multiple daggers, or a named approver?
- Is a successful current-revision test send mandatory before scheduling?
- Should subject/preheader be first-class Bard Draft fields or live in a newsletter artifact record?
- Can one Newsletter Draft support multiple audience-specific variants, or should each variant be a separate Draft?
- Which listmonk campaign statuses map to Bard `scheduled`, `published`, and `skipped`?
- Does listmonk provide a stable campaign archive URL for every send?
- Should approved rendered HTML be stored in Prism, Portal, Bard, or object storage?
- Which service should perform periodic provider reconciliation?
- How should schedule edits be handled after listmonk has already queued a campaign?
- When Bard reaches parity, should the Portal newsletter campaign collection remain the audit record or become a read-only mirror?
