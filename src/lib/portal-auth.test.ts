/**
 * @vitest-environment node
 */

import { SignJWT } from "jose";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  createPortalSessionToken,
  normalizePortalSession,
  readPortalSessionToken,
  verifyPortalLaunchToken,
  type PortalLaunchClaims,
} from "@/lib/portal-auth";

const launchSecret = "test-launch-secret";
const sessionSecret = "test-session-secret";
const issuer = "https://portal.raidguild.org";
const moduleSlug = "bard-calendar";

beforeEach(() => {
  process.env.PORTAL_MODULE_LAUNCH_SECRET = launchSecret;
  process.env.PORTAL_MODULE_SESSION_SECRET = sessionSecret;
  process.env.PORTAL_MODULE_ISSUER = issuer;
  process.env.PORTAL_MODULE_SLUG = moduleSlug;
});

afterEach(() => {
  delete process.env.PORTAL_MODULE_LAUNCH_SECRET;
  delete process.env.PORTAL_MODULE_SESSION_SECRET;
  delete process.env.PORTAL_MODULE_ISSUER;
  delete process.env.PORTAL_MODULE_SLUG;
});

function secret(value: string) {
  return new TextEncoder().encode(value);
}

async function signLaunchToken(overrides: Partial<PortalLaunchClaims> = {}) {
  const claims = {
    typ: "portal_module_launch",
    sub: "user:13",
    userID: 13,
    profileID: 36,
    email: "member@example.com",
    name: "Member Name",
    handle: "member-handle",
    roles: ["members"],
    moduleSlug,
    scopes: ["profile:read"],
    ...overrides,
  };

  return new SignJWT(claims)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(overrides.iss ?? issuer)
    .setAudience(overrides.aud ?? moduleSlug)
    .setIssuedAt()
    .setExpirationTime(overrides.exp ?? "2m")
    .sign(secret(launchSecret));
}

describe("Portal launch auth", () => {
  it("verifies valid launch tokens", async () => {
    const token = await signLaunchToken({ roles: ["admin"] });
    const claims = await verifyPortalLaunchToken(token);

    expect(claims.userID).toBe(13);
    expect(claims.roles).toEqual(["admin"]);
  });

  it("rejects wrong token type", async () => {
    const token = await signLaunchToken({ typ: "wrong" as PortalLaunchClaims["typ"] });

    await expect(verifyPortalLaunchToken(token)).rejects.toThrow("Invalid Portal launch token type.");
  });

  it("rejects wrong module slug", async () => {
    const token = await signLaunchToken({ moduleSlug: "wrong-module" });

    await expect(verifyPortalLaunchToken(token)).rejects.toThrow("Invalid Portal module slug.");
  });

  it("rejects wrong issuer or audience", async () => {
    const wrongIssuer = await signLaunchToken({ iss: "https://wrong.example" });
    const wrongAudience = await signLaunchToken({ aud: "wrong-module" });

    await expect(verifyPortalLaunchToken(wrongIssuer)).rejects.toThrow();
    await expect(verifyPortalLaunchToken(wrongAudience)).rejects.toThrow();
  });

  it("rejects expired tokens", async () => {
    const token = await signLaunchToken({ exp: Math.floor(Date.now() / 1000) - 10 });

    await expect(verifyPortalLaunchToken(token)).rejects.toThrow();
  });

  it("normalizes view and edit permissions from roles", async () => {
    const memberToken = await signLaunchToken({ roles: ["members"] });
    const adminToken = await signLaunchToken({ roles: ["admin"] });

    expect(normalizePortalSession(await verifyPortalLaunchToken(memberToken))).toMatchObject({
      portalUserID: "13",
      portalProfileID: "36",
      roles: ["members"],
      canView: true,
      canEdit: false,
    });
    expect(normalizePortalSession(await verifyPortalLaunchToken(adminToken))).toMatchObject({
      roles: ["admin"],
      canView: true,
      canEdit: true,
    });
  });

  it("round-trips local session cookies without storing the launch token", async () => {
    const launchToken = await signLaunchToken({ roles: ["admin"] });
    const session = normalizePortalSession(await verifyPortalLaunchToken(launchToken));
    const sessionToken = await createPortalSessionToken(session);
    const decoded = await readPortalSessionToken(sessionToken);

    expect(sessionToken).not.toBe(launchToken);
    expect(decoded).toMatchObject({
      portalUserID: "13",
      roles: ["admin"],
      canView: true,
      canEdit: true,
    });
  });
});
