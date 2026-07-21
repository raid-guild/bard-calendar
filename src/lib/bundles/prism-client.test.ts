import { afterEach, describe, expect, it, vi } from "vitest";
import { triggerPrismBundle } from "@/lib/bundles/prism-client";
import type { ContentBundleRun } from "@/lib/bundles/types";
import type { ContentTopic } from "@/lib/content/types";

const topic = {
  id: "top_1",
  title: "Source post",
  supporting_material_markdown: null,
  status: "active",
  created_by: null,
  metadata: {},
  external_source: "portal-post",
  external_id: "42",
  draft_count: 0,
  created_at: "2026-07-21T00:00:00.000Z",
  updated_at: "2026-07-21T00:00:00.000Z",
} satisfies ContentTopic;

const run = {
  id: "run_1",
  topic_id: topic.id,
  status: "queued",
  stage: "queued",
  source_system: "portal-post",
  source_id: "42",
  source_url: null,
  source_revision: null,
  prism_request_id: null,
  requested_channels: ["linkedin"],
  options: {},
  audit_checks: [],
  instructions: null,
  error_message: null,
  created_by: "tester",
  started_at: null,
  finished_at: null,
  created_at: "2026-07-21T00:00:00.000Z",
  updated_at: "2026-07-21T00:00:00.000Z",
} satisfies ContentBundleRun;

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("Prism bundle client", () => {
  it("fails clearly when Prism service configuration is absent", async () => {
    vi.stubEnv("PRISM_AGENT_API_BASE_URL", "");
    vi.stubEnv("PRISM_AGENT_SERVICE_TOKEN", "");

    await expect(
      triggerPrismBundle(topic, run, {
        source: { system: "portal-post", id: "42", url: null },
        channels: ["linkedin"],
        options: { audit: true, generate_images: true },
        instructions: null,
      }),
    ).rejects.toMatchObject({
      code: "PRISM_NOT_CONFIGURED",
      status: 503,
    });
  });

  it("triggers the configured hook without putting credentials in the body", async () => {
    vi.stubEnv("PRISM_AGENT_API_BASE_URL", "https://prism.example/");
    vi.stubEnv("PRISM_AGENT_SERVICE_TOKEN", "secret-token");
    vi.stubEnv("PRISM_CONTENT_BUNDLE_HOOK_KEY", "bundle-hook");
    vi.stubEnv("APP_BASE_URL", "https://bard.example");
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          ok: true,
          changeRequest: { id: "request-1", requestNumber: 12 },
        }),
        { status: 202, headers: { "content-type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      triggerPrismBundle(topic, run, {
        source: { system: "portal-post", id: "42", url: null },
        channels: ["linkedin"],
        options: { audit: true, generate_images: true },
        instructions: "Keep it practical.",
      }),
    ).resolves.toEqual({ requestId: "request-1", requestNumber: 12 });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      "https://prism.example/agent/hooks/bundle-hook/trigger",
    );
    expect(init.headers).toMatchObject({
      "x-service-token": "secret-token",
    });
    expect(init.body).not.toContain("secret-token");
    expect(JSON.parse(String(init.body))).toMatchObject({
      topic_id: topic.id,
      bundle_run_id: run.id,
      bard: { api_base_url: "https://bard.example" },
    });
  });

  it("reports upstream authentication failures as a gateway failure", async () => {
    vi.stubEnv("PRISM_AGENT_API_BASE_URL", "https://prism.example");
    vi.stubEnv("PRISM_AGENT_SERVICE_TOKEN", "wrong-token");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { "content-type": "application/json" },
        }),
      ),
    );

    await expect(
      triggerPrismBundle(topic, run, {
        source: { system: "portal-post", id: "42", url: null },
        channels: ["linkedin"],
        options: { audit: true, generate_images: true },
        instructions: null,
      }),
    ).rejects.toMatchObject({ code: "PRISM_HOOK_FAILED", status: 502 });
  });
});
