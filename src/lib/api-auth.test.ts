import { NextRequest } from "next/server";
import { afterEach, describe, expect, it } from "vitest";
import { isAuthorizedAgentRequest } from "@/lib/api-auth";

describe("agent API auth", () => {
  afterEach(() => {
    delete process.env.AGENT_API_TOKEN;
  });

  it("accepts the configured bearer token", () => {
    process.env.AGENT_API_TOKEN = "secret-token";

    const request = new NextRequest("https://calendar.test/api/agent/events", {
      headers: {
        authorization: "Bearer secret-token",
      },
    });

    expect(isAuthorizedAgentRequest(request)).toBe(true);
  });

  it("rejects missing or invalid tokens", () => {
    process.env.AGENT_API_TOKEN = "secret-token";

    const missing = new NextRequest("https://calendar.test/api/agent/events");
    const invalid = new NextRequest("https://calendar.test/api/agent/events", {
      headers: {
        authorization: "Bearer wrong-token",
      },
    });

    expect(isAuthorizedAgentRequest(missing)).toBe(false);
    expect(isAuthorizedAgentRequest(invalid)).toBe(false);
  });
});
