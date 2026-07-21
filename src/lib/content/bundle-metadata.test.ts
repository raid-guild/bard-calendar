import { describe, expect, it } from "vitest";
import {
  bundleAssets,
  bundleAuditChecks,
  bundleSource,
  latestBundleRun,
} from "@/lib/content/bundle-metadata";
import type { ContentDraft, ContentTopic } from "@/lib/content/types";

const topic = {
  id: "top_1",
  title: "Source post",
  supporting_material_markdown: null,
  status: "active",
  created_by: null,
  external_source: "portal-post",
  external_id: "42",
  draft_count: 1,
  created_at: "2026-07-21T00:00:00.000Z",
  updated_at: "2026-07-21T00:00:00.000Z",
  metadata: {
    portal_post_url: "https://portal.example/posts/source",
    source_revision: "sha256:source",
    latest_prism_request_id: "req_1",
    latest_bundle_run: { status: "generating", stage: "copy" },
    audit_checks: [
      { key: "cta", label: "CTA present", status: "pass" },
      { label: "Attribution", status: "unexpected", evidence: "Review links." },
      { status: "pass" },
    ],
    assets: [
      { artifact_id: "art_topic", kind: "image", variant: "x" },
    ],
  },
} satisfies ContentTopic;

const draft = {
  id: "drf_1",
  topic_id: topic.id,
  title: "LinkedIn draft",
  target_channel: "linkedin",
  markdown_content: "Draft",
  external_draft_url: null,
  status: "draft",
  created_by: null,
  external_source: null,
  external_id: null,
  dagger_count: 0,
  user_has_dagger: false,
  assigned_event_id: null,
  assigned_publish_at: null,
  live_url: null,
  created_at: "2026-07-21T00:00:00.000Z",
  updated_at: "2026-07-21T00:00:00.000Z",
  metadata: {
    assets: [
      {
        artifact_id: "art_draft",
        kind: "social-image",
        target_channel: "linkedin",
        mime_type: "image/png",
      },
      { artifact_id: "art_topic", kind: "duplicate" },
    ],
  },
} satisfies ContentDraft;

describe("bundle metadata", () => {
  it("reads the Portal source identity and latest run", () => {
    expect(bundleSource(topic)).toEqual({
      id: "42",
      url: "https://portal.example/posts/source",
      updatedAt: null,
      revision: "sha256:source",
    });
    expect(latestBundleRun(topic)).toMatchObject({
      requestId: "req_1",
      status: "generating",
      stage: "copy",
    });
  });

  it("accepts numeric Portal post identifiers from metadata", () => {
    expect(
      bundleSource({
        ...topic,
        external_source: null,
        external_id: null,
        metadata: { portal_post_id: 77 },
      }).id,
    ).toBe("77");
  });

  it("normalizes valid audit checks and defaults unknown states", () => {
    expect(bundleAuditChecks(topic)).toEqual([
      {
        key: "cta",
        label: "CTA present",
        status: "pass",
        evidence: null,
      },
      {
        key: "check-1",
        label: "Attribution",
        status: "not_checked",
        evidence: "Review links.",
      },
    ]);
  });

  it("collects and de-duplicates Topic and Draft asset references", () => {
    expect(bundleAssets(topic, [draft])).toEqual([
      {
        artifactId: "art_topic",
        kind: "duplicate",
        targetChannel: null,
        mimeType: null,
        url: null,
        draftId: draft.id,
      },
      {
        artifactId: "art_draft",
        kind: "social-image",
        targetChannel: "linkedin",
        mimeType: "image/png",
        url: null,
        draftId: draft.id,
      },
    ]);
  });
});
