# Content Distribution Bundle - Future Feature Spec

Status: implementation in progress

Date: July 21, 2026

Primary surface: Bard Calendar Topic detail page

Workflow engine: Prism

Canonical source: RaidGuild Portal post

Implementation progress:

- Phase 1 Topic bundle workspace implemented.
- Phase 2 Bard run/asset persistence and API contracts implemented.
- Phase 3 Prism workflow/hook configured and exercised with a Portal post.
- Authenticated artifact previews and per-channel regeneration implemented.
- Portal post selector, image-specific regeneration, and distribution remain future work.

## Summary

Add a content distribution workspace to Bard Calendar that turns one Portal post into a reviewable bundle of channel-specific copy, audits, images, attribution links, and publishing events.

Bard Calendar should be the human operations surface. Prism should fetch source content, run audits, generate copy and images, retain workflow artifacts, and write the generated results back to Bard through its agent API.

The existing content hierarchy remains valid:

```txt
Portal post
  -> Bard topic
    -> channel drafts
      -> publishing events
        -> live URLs and performance data
```

A new parent concept is not required. A Topic is the content kernel and bundle container. Each publishable channel output remains a Draft.

## Product Decision

Build the Bard UI and API contracts before authoring the production Prism workflow and hook.

Recommended delivery order:

1. Create a dedicated Topic detail page and bundle-oriented components.
2. Add the minimum run and asset reference model needed by that UI.
3. Add documented Bard API contracts, including an OpenAPI document.
4. Implement an ID-based Portal source flow.
5. Create the Prism workflow and hook against the stable Bard contracts.
6. Add Portal draft search and a title dropdown.
7. Add an explicitly approved distribution workflow after generation and review are reliable.

## Goals

- Start with an existing Portal post draft as canonical source material.
- Audit the post for CTA, positioning, metadata, attribution, and distribution readiness.
- Generate or regenerate copy for selected channels.
- Generate channel-appropriate images through Prism image-generation skills.
- Present the resulting packet in one coherent workspace.
- Preserve normal Bard Draft editing, approval, and calendar assignment.
- Make workflow state, source revisions, and generated-artifact provenance visible.
- Prevent regeneration from silently overwriting human edits.
- Give agents an explicit, idempotent API rather than requiring UI automation.

## Non-Goals For The First Spike

- Direct publication to social platforms.
- Social account OAuth.
- Fully conversational bundle creation.
- Analytics ingestion or campaign-performance recommendations.
- A general-purpose digital asset manager.
- Importing every type of Portal content.
- Real-time collaborative editing.
- Replacing Prism's request artifacts or run history with Bard-owned copies.

## System Ownership

| System | Owns |
| --- | --- |
| Portal | Canonical long-form post, post ID, current draft revision, authorship, visibility, and published URL |
| Prism | Fetching source content, audits, copy generation, image generation, workflow execution, run history, and durable workflow artifacts |
| Bard Topic | Bundle identity, Portal post reference, human-facing summary, and relationship to all channel outputs |
| Bard Draft | Editable channel-specific publishing copy, approval status, and selected asset references |
| Bard Publishing Event | Target channel, owner, publish time, publication state, selected media, and live URL |

## Topic And Draft Mapping

The Topic representing a Portal post should use a stable external identity:

```json
{
  "title": "ECWireless kickoff",
  "supporting_material_markdown": "Portal source: https://portal.raidguild.org/posts/ecwireless-kickoff",
  "external_source": "portal-post",
  "external_id": "123",
  "metadata": {
    "portal_post_id": 123,
    "portal_post_url": "https://portal.raidguild.org/posts/ecwireless-kickoff",
    "portal_updated_at": "2026-07-21T16:00:00.000Z",
    "source_revision": "sha256:...",
    "latest_prism_request_id": "..."
  }
}
```

Generated Drafts should have deterministic external identities:

```json
{
  "topic_id": "top_...",
  "title": "ECWireless kickoff - LinkedIn",
  "target_channel": "linkedin",
  "markdown_content": "...",
  "status": "draft",
  "external_source": "prism-content-bundle",
  "external_id": "portal-post:123:linkedin",
  "metadata": {
    "portal_post_id": 123,
    "prism_request_id": "...",
    "source_revision": "sha256:...",
    "generated_content_hash": "sha256:...",
    "generated_at": "2026-07-21T18:00:00.000Z"
  }
}
```

Prism should use the existing Topic and Draft upsert endpoints. Repeating a run for the same Portal post and channel must reconcile with existing records rather than create duplicates.

## Primary UX: Topic Detail Page

Create a dedicated route:

```txt
/topics/[id]
```

The current Drafts tab remains the bundle index. Clicking a Topic title or a new open-detail action navigates to the Topic detail page. The existing full-screen edit dialog can remain for quick metadata edits initially, but the new page becomes the main place to work with a bundle.

### Page Header

Show:

- Topic title and status.
- Portal source badge and link.
- Source revision or last-updated time.
- Bundle readiness summary, such as `3 of 4 drafts ready`.
- Latest generation status.
- Primary `Generate bundle` or `Regenerate bundle` action.
- Secondary Topic edit and archive actions.

The primary action opens a generation dialog instead of immediately starting work.

### Source Panel

Show a compact source summary:

- Portal post title, ID, slug, and status.
- Last Portal update observed by Prism.
- Canonical source link.
- Short excerpt or summary when available.
- A warning when the Portal source has changed since the latest bundle run.

Do not reproduce the full Portal editor in Bard. Portal remains the place to edit the source post.

### Generation Dialog

For the first spike, accept:

- Portal post ID or URL.
- Target-channel checkboxes.
- Optional bundle instructions.
- Toggles for `Run content audit` and `Generate images`.

Default channels can be X, LinkedIn, and Discord. The available choices should use Bard's channel constants.

When Portal search is added, replace the raw ID field with a searchable post selector that displays title, status, slug, and last update. Keep an advanced ID/URL entry fallback.

### Run Status Banner

When a generation run exists, show one unambiguous state:

```txt
queued -> fetching source -> auditing -> generating copy -> generating images -> syncing -> complete
```

Also support `failed`, `partially complete`, and `canceled`.

The banner should include:

- Current stage.
- Started time and elapsed time.
- Prism request reference.
- Retry or resume action when appropriate.
- A concise error with a link to detailed run information.

Use polling for the first implementation. Real-time streaming is unnecessary for the spike.

### Audit Panel

Render the audit as structured checks, not only a markdown blob:

- CTA present and specific.
- Primary audience identifiable.
- Canonical link available.
- Attribution/source links present.
- Title and summary suitable for sharing.
- Social preview image available.
- Claims requiring verification identified.
- Channel-specific constraints or warnings.

Each check should have a state such as `pass`, `warning`, `fail`, or `not checked`, plus short evidence and a suggested action. Provide a link to the full Prism `audit.md` artifact.

Audit failures should inform humans but should not automatically block draft editing. A later policy can define which failures block approval or distribution.

### Channel Draft Cards

Display one card per requested channel. Each card should provide:

- Channel and Draft status.
- Generated or human-edited indicator.
- Copy preview with character count where meaningful.
- `Edit`, `Copy`, `Regenerate`, `Approve`, and `Assign to calendar` actions.
- Selected image thumbnail and asset chooser.
- Last generated time and source revision.
- Warning when the source changed after generation.
- Warning when regeneration would conflict with human edits.

Editing should use the existing Draft form initially. A later pass can introduce inline editing.

`Regenerate` should support either the entire bundle or one selected channel. It must open a confirmation when the Draft differs from its last generated hash.

### Asset Gallery

Show generated images and image briefs together:

- Thumbnail or preview.
- Intended channel and aspect ratio.
- Generation status.
- Prompt/version metadata.
- `Select for draft`, `Regenerate`, `Open`, and `Download` actions.
- Human approval state.

Prism owns the initial binary artifact. Bard stores an artifact reference and retrieves it through a server-side route so Prism credentials are never exposed to browser code.

Do not store temporary or internally authenticated Prism URLs directly as public Publishing Event media URLs. Before external publication, either use a stable Bard proxy URL or promote the approved image into durable public media storage.

### Attribution And Links

Show a reusable block containing:

- Canonical Portal post URL.
- Campaign or referral parameters.
- Named sources and credits.
- Suggested CTA URL.
- Copy buttons for each URL.

This information should also be represented in the bundle manifest so downstream distribution does not reconstruct it from prose.

### Activity And Run History

Provide a compact history of:

- Generation runs.
- Source revisions used.
- Drafts created or updated.
- Assets generated or selected.
- Conflicts that prevented overwrite.
- Calendar assignments.

The first version can link to Prism for detailed workflow history rather than reproducing every agent event in Bard.

## Suggested Page Layout

Desktop:

```txt
+------------------------------------------------------------------+
| Topic title     Portal source     readiness      Generate bundle |
+------------------------------------------------------------------+
| Run status / stale-source / error banner                          |
+------------------------------------+-----------------------------+
| Source and audit                   | Attribution and bundle info |
+------------------------------------+-----------------------------+
| Channel drafts                                                   |
| [X card]          [LinkedIn card]          [Discord card]        |
+------------------------------------------------------------------+
| Generated assets and image briefs                                |
+------------------------------------------------------------------+
| Run history and activity                                         |
+------------------------------------------------------------------+
```

Mobile should use the same order as a single column. Draft actions must remain available without relying on hover states.

## Proposed Persistence Additions

The first UI could place latest-run and artifact references in Topic/Draft metadata, but first-class tables are preferred once the integration is more than a disposable prototype.

### `content_bundle_runs`

Suggested fields:

```txt
id
topic_id
status
stage
source_system
source_id
source_revision
prism_request_id
requested_channels_json
options_json
error_message
started_at
finished_at
created_by
created_at
updated_at
```

This table is Bard's local projection of a Prism run. Prism remains authoritative for detailed execution history.

### `content_assets`

Suggested fields:

```txt
id
topic_id
draft_id nullable
kind
status
target_channel nullable
prism_request_id
prism_artifact_id
stable_url nullable
mime_type
prompt nullable
metadata_json
created_at
updated_at
```

The table stores references and selection state, not necessarily the binary itself.

## Bard API Shape

The UI should call Bard-owned routes. Browser code must not call Prism or Portal with service credentials.

Suggested browser routes:

```http
GET  /api/topics/{id}/bundle
POST /api/topics/{id}/bundle-runs
GET  /api/topics/{id}/bundle-runs
GET  /api/bundle-runs/{id}
POST /api/drafts/{id}/regenerate
GET  /api/content-assets/{id}/content
```

`GET /api/topics/{id}/bundle` should return a composite view model containing Topic, Drafts, current run, audit summary, assets, source state, and calendar assignments. This avoids making the page coordinate many unrelated client requests.

Suggested generation request:

```json
{
  "source": {
    "system": "portal-post",
    "id": "123",
    "url": "https://portal.raidguild.org/posts/ecwireless-kickoff"
  },
  "channels": ["x", "linkedin", "discord"],
  "options": {
    "audit": true,
    "generate_images": true
  },
  "instructions": "Lead with the practical takeaway."
}
```

The route should:

1. Require an authorized Bard editor.
2. Create the local queued run.
3. Trigger the configured Prism hook server-to-server.
4. Save the returned Prism request identifier.
5. Return `202 Accepted` with the local run.

Prism continues to use the existing authenticated agent Topic and Draft upsert routes when syncing outputs.

## Portal Draft Retrieval And Authentication

### First Spike

Bard accepts a Portal post ID or URL but does not fetch the full draft. Prism fetches the source using its server-side Portal credential.

Before implementation, verify that the Prism credential can read Portal drafts. Portal currently limits draft reads to content editors; a credential with only the Portal `agent` role may not be sufficient.

The Bard Portal launch token cannot be reused for Portal API access. Bard exchanges it for a local session containing identity and roles. It proves who may operate Bard but does not authorize Bard to enumerate Portal drafts.

### Searchable Dropdown Follow-Up

Add a narrowly scoped Portal integration endpoint such as:

```http
GET /api/integrations/bard-calendar/posts?q={query}
GET /api/integrations/bard-calendar/posts/{id}
```

The list route should return only the data needed by the selector:

```txt
id
title
slug
status
updated_at
```

Bard's backend calls this endpoint with server-to-server integration authentication. Do not forward a user's Portal cookies and do not put the integration credential in browser code.

The existing authenticated Portal newsletter post selector is a useful query implementation reference, but its browser-session authentication should not be copied as the cross-application contract.

Prism should not proxy title searches for the dropdown. Listing posts is deterministic application behavior and should not require an agent run or language-model request.

## Prism Workflow And Hook

Suggested hook key:

```txt
content-distribution-bundle
```

Suggested workflow stages:

1. Validate the trigger payload and reconcile an existing Topic/run.
2. Fetch the Portal post and calculate a stable source revision.
3. Normalize the Portal Lexical JSON into an agent-readable representation.
4. Audit CTA, metadata, attribution, claims, links, and channel readiness.
5. Generate selected channel copy using the configured Prism skills.
6. Generate image briefs and images when requested.
7. Save durable Prism request artifacts.
8. Upsert the Bard Topic.
9. Reconcile and upsert Bard Drafts without overwriting human changes.
10. Post run completion, audit summary, and asset references back to Bard.

Expected Prism artifacts:

```txt
source.json
source.md
audit.md
audit.json
bundle.json
draft-x.md
draft-linkedin.md
draft-discord.md
image-brief.md
image-x.png
image-linkedin.png
```

`bundle.json` should be the machine-readable manifest joining source revision, audit results, Draft external IDs, asset artifact IDs, attribution links, and generation versions.

The hook should capture the original payload and create a durable Prism request. It should return quickly after queueing work; Bard polls its local run endpoint for progress.

## Regeneration And Overwrite Safety

Generated content must carry:

- Source revision.
- Generated content hash.
- Prism request ID.
- Generation timestamp.
- Generator/workflow version.

Before updating an existing Draft, compare the current Draft body with its last generated hash:

- If unchanged, Prism may update it idempotently.
- If changed by a human, do not overwrite it.
- Mark the run partially complete and return a proposed revision or conflict artifact.
- Let the human compare and accept the regenerated version.

Regenerating images should create a new asset variant rather than destructively replacing an approved asset.

## Distribution Workflow

Direct distribution should be a separate future workflow and hook. Generation completion must never imply permission to publish.

A distribution request should require:

- An approved/ready Bard Draft.
- A selected approved asset when media is required.
- Target channel/account.
- Explicit human approval.
- Idempotency key.
- A successful response containing the external post ID and live URL.

After publication, Prism or the publishing adapter updates the linked Bard Publishing Event with status and live URL.

## OpenAPI And Agent Documentation

Before connecting Prism, add:

```txt
openapi/bard-calendar.openapi.yaml
src/app/api/openapi/route.ts
```

The specification should cover existing agent Topic, Draft, and Event endpoints plus new bundle sync/run endpoints.

Update `AGENT.md` with:

- Portal post to Topic identity rules.
- Deterministic Draft identity rules.
- Bundle run lifecycle.
- Asset reference behavior.
- Required idempotency and overwrite checks.
- Example Prism sync payloads.
- Clear separation between generation and publication authority.

## Delivery Phases

### Phase 1: Bundle Workspace UI

- Add `/topics/[id]`.
- Link Topic rows to the page.
- Render source, audit, Draft, asset, and run-history sections.
- Use existing Topic and Draft data plus fixtures or empty states.
- Reuse existing Draft editing and calendar-assignment behavior.
- Add accessible loading, empty, stale-source, conflict, partial, and failure states.

### Phase 2: Bard Data And API Contracts

- Add bundle run and asset reference persistence.
- Add the composite bundle endpoint and run endpoints.
- Add the server-side artifact proxy.
- Add OpenAPI and agent documentation.
- Add validation, authorization, and API tests.

### Phase 3: ID-Based Prism Integration

- Configure the Prism workflow and disabled-by-default hook.
- Verify Prism can fetch draft Portal posts.
- Trigger runs from Bard by Portal post ID.
- Sync Topic, Draft, audit, and image references into Bard.
- Exercise retries, duplicate triggers, partial completion, and human-edit conflicts.

### Phase 4: Portal Post Selector

- Add a scoped Portal integration endpoint.
- Add server-to-server Bard authentication for it.
- Add a debounced searchable dropdown with title, status, slug, and update time.
- Keep manual ID/URL entry as a fallback.

### Phase 5: Review Improvements

- Add structured audit controls.
- Add proposed-revision comparison and acceptance.
- Add per-channel and per-image regeneration.
- Add asset selection and approval.

### Phase 6: Approved Distribution

- Design a separate distribution workflow.
- Add explicit approval and account selection.
- Write external post IDs and live URLs back to publishing events.
- Add analytics/attribution ingestion only after publishing reconciliation is dependable.

## Acceptance Criteria For The First End-To-End Spike

- An authorized Bard editor can open a Topic bundle page.
- The editor can enter a valid Portal post ID and select at least X, LinkedIn, and Discord.
- Bard creates and displays a queued run without exposing service credentials.
- Prism fetches the Portal draft and records the source revision.
- Prism creates an audit, three channel Drafts, and at least one image artifact.
- Prism upserts one Bard Topic linked to the Portal post.
- Prism upserts generated Drafts under that Topic without duplicates.
- Bard shows generation status, audit results, Draft previews, and image previews.
- A Draft can still be edited, daggered, and assigned to the calendar through existing Bard behavior.
- Repeating the run does not overwrite a human-edited Draft.
- Failures identify the failed stage and retain enough information to retry safely.

## Open Questions

- Which channels should be selected by default?
- Which CTA and attribution checks are required versus advisory?
- Does the deployed Prism Portal credential currently have permission to read drafts?
- Should approved images remain behind a Bard proxy or be promoted to Portal Media/object storage?
- Should `ready` status require a dagger, an explicit approval action, or both?
- How long should completed run history remain visible in Bard?
- Should a source post change automatically mark all generated Drafts stale?
- Which Prism skills and brand references form the initial generation profile?
