import { describe, expect, it } from "vitest";
import {
  parseIsoDate,
  toDatetimeLocalValue,
  toIsoString,
  withLocalDate,
  withLocalHour,
} from "@/lib/dates";

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

  it("changes the local calendar date and normalizes to a whole hour", () => {
    expect(withLocalDate("2026-07-30T13:45", new Date(2026, 7, 2))).toBe(
      "2026-08-02T13:00",
    );
  });

  it("uses clamped whole local hours", () => {
    expect(withLocalHour("2026-07-30T13:45", 24)).toBe("2026-07-30T23:00");
    expect(withLocalHour("2026-07-30T13:45", -2)).toBe("2026-07-30T00:00");
  });
});
