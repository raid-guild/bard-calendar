import { describe, expect, it } from "vitest";
import { categoryCreateSchema, topicCreateSchema, topicListQuerySchema, topicPublishSchema, topicReopenSchema } from "@/lib/content/validation";

describe("topic publication and categorization validation", () => {
  it("requires explicit evidence for publication", () => {
    expect(topicPublishSchema.safeParse({ publication_at: "2026-08-25T12:00:00Z", evidence_type: "live_url", manual_confirmation: false, actor: "raida" }).success).toBe(false);
    expect(topicPublishSchema.safeParse({ publication_at: "2026-08-25T12:00:00Z", evidence_type: "manual_confirmation", manual_confirmation: true, actor: "raida" }).success).toBe(true);
  });

  it("requires a reopen reason", () => {
    expect(topicReopenSchema.safeParse({ reason: " ", actor: "raida" }).success).toBe(false);
  });

  it("normalizes tags and bounds independent interest fields", () => {
    const result = topicCreateSchema.safeParse({ title: "Topic", tags: ["AI", "ai"], editorial_interest_score: 101 });
    expect(result.success).toBe(false);
    const valid = topicCreateSchema.parse({ title: "Topic", tags: ["AI", "ai"], editorial_interest_score: 80, engagement_interest_count: 4 });
    expect(valid.tags).toEqual(["ai"]);
  });

  it("accepts reporting filters and category keys", () => {
    expect(topicListQuerySchema.safeParse({ publication_status: "published", category_id: "uncategorized", tag: "Launch" }).success).toBe(true);
    expect(categoryCreateSchema.safeParse({ key: "product-news", name: "Product news" }).success).toBe(true);
  });
});
