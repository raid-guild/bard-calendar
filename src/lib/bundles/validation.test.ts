import { describe, expect, it } from "vitest";
import {
  createBundleRunSchema,
  updateBundleRunSchema,
  upsertContentAssetSchema,
} from "@/lib/bundles/validation";
import { mapUpsertContentAssetInputToUpdateRow } from "@/lib/bundles/mapping";

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
