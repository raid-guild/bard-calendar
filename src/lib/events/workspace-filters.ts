import type { EventFilters } from "@/lib/events/types";

export function buildWorkspaceEventFilters(
  tab: "calendar" | "list" | "published" | "drafts",
  filters: EventFilters,
  range: { start: string; end: string },
): EventFilters {
  if (tab === "published") {
    // Published is a retrospective view. It is unbounded unless the operator
    // explicitly supplies start/end filters.
    return { ...filters, status: "published", order: "desc" };
  }

  return {
    ...filters,
    start: filters.start ?? range.start,
    end: filters.end ?? range.end,
  };
}
