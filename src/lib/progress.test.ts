import { describe, expect, it } from "vitest";
import { normalizeProgress } from "@/lib/progress";

describe("normalizeProgress", () => {
  it("rounds and clamps progress values", () => {
    expect(normalizeProgress(-2)).toBe(0);
    expect(normalizeProgress(42.6)).toBe(43);
    expect(normalizeProgress(102)).toBe(100);
  });
});
