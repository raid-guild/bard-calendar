import { describe, expect, it } from "vitest";
import { buildWorkspaceEventFilters } from "@/lib/events/workspace-filters";

const range = {
  start: "2026-08-01T00:00:00.000Z",
  end: "2026-08-31T23:59:59.999Z",
};

describe("workspace event filters", () => {
  it("keeps the global Published view unbounded and newest-first by default", () => {
    expect(buildWorkspaceEventFilters("published", { campaign: "Summer Brigade" }, range)).toEqual({
      campaign: "Summer Brigade",
      status: "published",
      order: "desc",
    });
  });

  it("honors explicit Published date filters", () => {
    const filters = { start: "2026-08-18T00:00:00.000Z", end: "2026-08-19T00:00:00.000Z" };
    expect(buildWorkspaceEventFilters("published", filters, range)).toMatchObject(filters);
  });

  it("applies the calendar range to ordinary event views", () => {
    expect(buildWorkspaceEventFilters("list", {}, range)).toEqual(range);
  });
});
