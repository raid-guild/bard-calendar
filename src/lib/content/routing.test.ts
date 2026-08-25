import { describe, expect, it } from "vitest";
import { legacyFromRoute, routeFromLegacy, routeSchema } from "@/lib/content/routing";

describe("structured content routing", () => {
  it("keeps RaidGuild and Queen Raida X identities distinct", () => {
    expect(routeFromLegacy("x: main account")?.account).toBe("raidguild");
    expect(routeFromLegacy("x: raida")?.account).toBe("queen-raida");
  });
  it("rejects ambiguous generic X", () => {
    expect(routeSchema.safeParse({ platform: "x" }).success).toBe(false);
  });
  it("requires explicit LinkedIn format", () => {
    expect(routeSchema.safeParse({ platform: "linkedin", account: "raidguild" }).success).toBe(false);
    expect(legacyFromRoute({ platform: "linkedin", account: "raidguild", format: "article" })).toBe("linkedin");
  });
});
