import { describe, expect, it } from "vitest";
import { isUniqueConstraintViolation } from "@/lib/db/errors";

describe("database errors", () => {
  it("recognizes direct and wrapped Postgres unique violations", () => {
    expect(
      isUniqueConstraintViolation(
        { code: "23505", constraint_name: "content_topics_external_identity_idx" },
        "content_topics_external_identity_idx",
      ),
    ).toBe(true);
    expect(
      isUniqueConstraintViolation(
        { cause: { code: "23505" } },
        "content_topics_external_identity_idx",
      ),
    ).toBe(true);
  });

  it("does not classify unrelated database failures as identity conflicts", () => {
    expect(isUniqueConstraintViolation({ code: "23503" })).toBe(false);
    expect(
      isUniqueConstraintViolation(
        { code: "23505", constraint_name: "some_other_unique_index" },
        "content_topics_external_identity_idx",
      ),
    ).toBe(false);
  });
});
