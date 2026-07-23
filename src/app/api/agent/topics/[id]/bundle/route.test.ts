import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { authorize, getTopicBundle } = vi.hoisted(() => ({
  authorize: vi.fn(),
  getTopicBundle: vi.fn(),
}));

vi.mock("@/lib/api-auth", () => ({
  isAuthorizedAgentRequest: authorize,
}));

vi.mock("@/lib/bundles/topic-bundle", () => ({ getTopicBundle }));

import { GET } from "@/app/api/agent/topics/[id]/bundle/route";

const request = new NextRequest(
  "https://calendar.test/api/agent/topics/top_1/bundle",
);
const context = { params: Promise.resolve({ id: "top_1" }) };

beforeEach(() => {
  authorize.mockReset();
  getTopicBundle.mockReset();
});

describe("agent Topic bundle route", () => {
  it("rejects requests without the agent credential", async () => {
    authorize.mockReturnValue(false);

    const response = await GET(request, context);

    expect(response.status).toBe(401);
    expect(getTopicBundle).not.toHaveBeenCalled();
  });

  it("returns the composite bundle to an authorized agent", async () => {
    const bundle = {
      topic: { id: "top_1" },
      drafts: [{ id: "drf_1", metadata: { source_revision: "sha256:1" } }],
      runs: [
        {
          id: "run_1",
          audit_checks: [
            { key: "cta", label: "CTA", status: "warning" },
          ],
        },
      ],
      assets: [{ id: "ast_1", metadata: { alt_text: "Raid party" } }],
      latest_run: { id: "run_1" },
    };
    authorize.mockReturnValue(true);
    getTopicBundle.mockResolvedValue(bundle);

    const response = await GET(request, context);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ bundle });
    expect(getTopicBundle).toHaveBeenCalledWith("top_1");
  });

  it("returns 404 when the Topic does not exist", async () => {
    authorize.mockReturnValue(true);
    getTopicBundle.mockResolvedValue(null);

    const response = await GET(request, context);

    expect(response.status).toBe(404);
  });
});
