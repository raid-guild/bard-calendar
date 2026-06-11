import { describe, expect, it } from "vitest";
import { parseIsoDate, toDatetimeLocalValue, toIsoString } from "@/lib/dates";

describe("date helpers", () => {
  it("parses valid ISO dates and rejects invalid dates", () => {
    expect(parseIsoDate("2026-07-01T16:00:00.000Z")).toBeInstanceOf(Date);
    expect(parseIsoDate("not-a-date")).toBeNull();
  });

  it("serializes dates to ISO strings", () => {
    expect(toIsoString(new Date("2026-07-01T16:00:00.000Z"))).toBe("2026-07-01T16:00:00.000Z");
    expect(toIsoString("not-a-date")).toBeNull();
  });

  it("creates datetime-local compatible values", () => {
    expect(toDatetimeLocalValue(new Date("2026-07-01T16:00:00.000Z"))).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/,
    );
  });
});
