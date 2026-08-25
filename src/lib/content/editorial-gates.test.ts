import { describe, expect, it } from "vitest";
import { evaluateEditorialGates } from "@/lib/content/editorial-gates";

const draft = { editorial_status: "approved", route: { platform: "x", account: "raidguild", format: "post" }, audit_checks: ["research", "writing", "brand_voice", "public_output_safety"].map((key) => ({ key, status: "pass" })) };

describe("editorial gates", () => {
  it("allows an approved audited social draft", () => expect(evaluateEditorialGates(draft as never)).toEqual({ allowed: true, blockers: [] }));
  it("requires SEO/AEO for article output", () => expect(evaluateEditorialGates({ ...draft, route: { platform: "linkedin", account: "raidguild", format: "article" } } as never).blockers).toContain("seo_aeo"));
  it("does not treat warnings as passes", () => expect(evaluateEditorialGates({ ...draft, audit_checks: [{ key: "research", status: "warning" }] } as never).allowed).toBe(false));
});
