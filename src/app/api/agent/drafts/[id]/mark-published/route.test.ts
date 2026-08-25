import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LiveUrlConflictError } from "@/lib/events/live-url";

const { authorize, markDraftPublished } = vi.hoisted(() => ({
  authorize: vi.fn(),
  markDraftPublished: vi.fn(),
}));

vi.mock("@/lib/api-auth", () => ({ isAuthorizedAgentRequest: authorize }));
vi.mock("@/lib/content/queries", () => ({ markDraftPublished }));

import { POST } from "@/app/api/agent/drafts/[id]/mark-published/route";

const context = { params: Promise.resolve({ id: "drf_1" }) };
const body = {
  live_url: "https://example.com/posts/one",
  published_at: "2026-08-18T23:10:38Z",
};

function request() {
  return new NextRequest("https://calendar.test/api/agent/drafts/drf_1/mark-published", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

beforeEach(() => {
  authorize.mockReset();
  markDraftPublished.mockReset();
});

describe("agent mark-published route", () => {
  it("rejects requests without the agent credential", async () => {
    authorize.mockReturnValue(false);

    const response = await POST(request(), context);

    expect(response.status).toBe(401);
    expect(markDraftPublished).not.toHaveBeenCalled();
  });

  it("returns the same event for an idempotent update and a later insert", async () => {
    const existing = { id: "evt_existing", live_url: body.live_url, status: "published" };
    const inserted = { id: "evt_new", live_url: body.live_url, status: "published" };
    authorize.mockReturnValue(true);
    markDraftPublished
      .mockResolvedValueOnce(existing)
      .mockResolvedValueOnce(existing)
      .mockResolvedValueOnce(inserted);

    const first = await POST(request(), context);
    const repeated = await POST(request(), context);
    const created = await POST(request(), { params: Promise.resolve({ id: "drf_2" }) });

    expect(await first.json()).toEqual({ event: existing });
    expect(await repeated.json()).toEqual({ event: existing });
    expect(await created.json()).toEqual({ event: inserted });
    expect(markDraftPublished).toHaveBeenNthCalledWith(1, "drf_1", body);
    expect(markDraftPublished).toHaveBeenNthCalledWith(3, "drf_2", body);
  });

  it("returns 409 when the normalized live URL belongs to another event", async () => {
    authorize.mockReturnValue(true);
    markDraftPublished.mockRejectedValue(new LiveUrlConflictError());

    const response = await POST(request(), context);

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      error: "This live URL is already attached to another publishing event.",
    });
  });
});
