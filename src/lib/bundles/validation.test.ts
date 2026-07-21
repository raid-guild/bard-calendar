import { describe, expect, it } from "vitest";
import {
  createBundleRunSchema,
  updateBundleRunSchema,
  upsertContentAssetSchema,
} from "@/lib/bundles/validation";

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
});
