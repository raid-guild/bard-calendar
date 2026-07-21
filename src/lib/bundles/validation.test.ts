import { afterEach, describe, expect, it } from "vitest";
import {
  createBundleRunSchema,
  updateBundleRunSchema,
  upsertContentAssetSchema,
} from "@/lib/bundles/validation";
import { mapUpsertContentAssetInputToUpdateRow } from "@/lib/bundles/mapping";

const originalDurableHosts = process.env.BARD_CONTENT_ASSET_DURABLE_HOSTS;

afterEach(() => {
  if (originalDurableHosts === undefined) {
    delete process.env.BARD_CONTENT_ASSET_DURABLE_HOSTS;
  } else {
    process.env.BARD_CONTENT_ASSET_DURABLE_HOSTS = originalDurableHosts;
  }
});

describe("bundle validation", () => {
  it("normalizes a generation request and removes duplicate channels", () => {
    expect(
      createBundleRunSchema.parse({
        source: { id: " 42 " },
        channels: ["linkedin", "linkedin", "discord"],
      }),
    ).toEqual({
      source: { system: "portal-post", id: "42", url: null },
      channels: ["linkedin", "discord"],
      options: { audit: true, generate_images: true },
      instructions: null,
    });
  });

  it("requires a source ID and at least one channel", () => {
    expect(
      createBundleRunSchema.safeParse({
        source: { id: "" },
        channels: [],
      }).success,
    ).toBe(false);
  });

  it("accepts structured audit progress updates", () => {
    expect(
      updateBundleRunSchema.parse({
        status: "running",
        stage: "auditing",
        audit_checks: [
          {
            key: "cta",
            label: "CTA present",
            status: "warning",
            evidence: "CTA is nonspecific.",
          },
        ],
      }),
    ).toMatchObject({ status: "running", stage: "auditing" });
  });

  it("preserves omitted run fields and supports explicit clears", () => {
    expect(updateBundleRunSchema.parse({ status: "running" })).toEqual({
      status: "running",
    });
    expect(
      updateBundleRunSchema.parse({
        source_revision: "",
        prism_request_id: null,
        error_message: null,
      }),
    ).toEqual({
      source_revision: null,
      prism_request_id: null,
      error_message: null,
    });
  });

  it("adds a server-side finish time to terminal run updates", () => {
    const before = Date.now();
    const terminal = updateBundleRunSchema.parse({
      status: "complete",
      finished_at: null,
    });

    expect(terminal.finished_at).toBeTypeOf("string");
    expect(new Date(terminal.finished_at!).getTime()).toBeGreaterThanOrEqual(before);
    expect(
      updateBundleRunSchema.safeParse({ finished_at: null }).success,
    ).toBe(false);
    expect(
      updateBundleRunSchema.parse({ status: "running", finished_at: null }),
    ).toEqual({ status: "running", finished_at: null });
  });

  it("rejects invalid stable asset URLs", () => {
    expect(
      upsertContentAssetSchema.safeParse({
        topic_id: "top_1",
        kind: "social-image",
        prism_request_id: "req_1",
        prism_artifact_id: "art_1",
        stable_url: "/internal/artifact",
      }).success,
    ).toBe(false);
  });

  it("accepts only configured durable asset hosts without signed parameters", () => {
    process.env.BARD_CONTENT_ASSET_DURABLE_HOSTS = "assets.raidguild.org";
    const input = {
      topic_id: "top_1",
      kind: "social-image",
      prism_request_id: "req_1",
      prism_artifact_id: "art_1",
    };

    expect(
      upsertContentAssetSchema.safeParse({
        ...input,
        stable_url: "https://assets.raidguild.org/bundles/art_1.png",
      }).success,
    ).toBe(true);
    expect(
      upsertContentAssetSchema.safeParse({
        ...input,
        stable_url: "https://other.example.com/art_1.png",
      }).success,
    ).toBe(false);
    expect(
      upsertContentAssetSchema.safeParse({
        ...input,
        stable_url:
          "https://assets.raidguild.org/art_1.png?X-Amz-Signature=temporary",
      }).success,
    ).toBe(false);
  });

  it("only updates optional asset fields when they are provided", () => {
    const parsed = upsertContentAssetSchema.parse({
      topic_id: "top_1",
      kind: "social-image",
      prism_request_id: "req_1",
      prism_artifact_id: "art_1",
    });
    const updatedAt = new Date("2026-07-21T20:00:00.000Z");

    expect(parsed).not.toHaveProperty("stable_url");
    expect(parsed).not.toHaveProperty("metadata");
    expect(mapUpsertContentAssetInputToUpdateRow(parsed, updatedAt)).toEqual({
      topicId: "top_1",
      kind: "social-image",
      status: "generated",
      updatedAt,
    });
  });

  it("allows an asset upsert to explicitly clear nullable fields", () => {
    const parsed = upsertContentAssetSchema.parse({
      topic_id: "top_1",
      draft_id: null,
      kind: "social-image",
      target_channel: "",
      prism_request_id: "req_1",
      prism_artifact_id: "art_1",
      stable_url: null,
      metadata: {},
    });
    const update = mapUpsertContentAssetInputToUpdateRow(parsed);

    expect(update).toMatchObject({
      draftId: null,
      targetChannel: null,
      stableUrl: null,
      metadataJson: {},
    });
  });
});
