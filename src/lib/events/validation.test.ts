import { describe, expect, it } from "vitest";
import {
  agentUpsertSchema,
  eventCreateSchema,
  eventUpdateSchema,
} from "@/lib/events/validation";

const validEvent = {
  name: "Share weekly raid opportunities thread",
  publish_at: "2026-07-01T16:00:00.000Z",
  target_channel: "discord",
  status: "planned",
  draft_url: "https://example.com/draft",
  metadata: {
    persona: "RaidGuild",
  },
};

describe("event validation", () => {
  it("accepts a valid event payload", () => {
    const parsed = eventCreateSchema.safeParse(validEvent);

    expect(parsed.success).toBe(true);
  });

  it("rejects blank names", () => {
    const parsed = eventCreateSchema.safeParse({ ...validEvent, name: " " });

    expect(parsed.success).toBe(false);
  });

  it("rejects invalid URLs", () => {
    const parsed = eventCreateSchema.safeParse({
      ...validEvent,
      media_url: "not-a-url",
    });

    expect(parsed.success).toBe(false);
  });

  it("requires external identity for agent upserts", () => {
    const missingIdentity = agentUpsertSchema.safeParse(validEvent);
    const withIdentity = agentUpsertSchema.safeParse({
      ...validEvent,
      external_source: "content-planner-agent",
      external_id: "raidguild-week-27-discord-1",
    });

    expect(missingIdentity.success).toBe(false);
    expect(withIdentity.success).toBe(true);
  });

  it("accepts partial event updates", () => {
    const parsed = eventUpdateSchema.safeParse({
      status: "drafting",
      draft_url: "https://example.com/draft",
      metadata: {
        source_doc: "https://example.com/brief",
      },
    });

    expect(parsed.success).toBe(true);
  });
});
