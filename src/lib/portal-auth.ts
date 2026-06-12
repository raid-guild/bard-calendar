import { jwtVerify, SignJWT, type JWTPayload } from "jose";
import { NextRequest } from "next/server";
import { getPortalPermissions } from "@/lib/portal-role-policy";

export const portalSessionCookieName = "bard_calendar_portal_session";

const sessionLifetimeSeconds = 60 * 60 * 12;

export type PortalLaunchClaims = JWTPayload & {
  aud: string;
  email?: string;
  exp: number;
  handle?: string;
  iss: string;
  moduleSlug: string;
  name?: string;
  picture?: string;
  profileID?: number | string;
  roles?: string[];
  sub: string;
  typ: "portal_module_launch";
  userID: number | string;
};

export type PortalSession = {
  portalUserID: string;
  portalProfileID?: string;
  email?: string;
  name?: string;
  handle?: string;
  picture?: string;
  roles: string[];
  canView: boolean;
  canEdit: boolean;
  issuedAt: number;
};

type PortalSessionClaims = JWTPayload & PortalSession;

function requireEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required.`);
  }

  return value;
}

function encodeSecret(secret: string) {
  return new TextEncoder().encode(secret);
}

function expectedModuleSlug() {
  return process.env.PORTAL_MODULE_SLUG ?? "bard-calendar";
}

function expectedIssuer() {
  return process.env.PORTAL_MODULE_ISSUER ?? "https://portal.raidguild.org";
}

export function portalModulesUrl() {
  return process.env.PORTAL_MODULES_URL ?? "https://portal.raidguild.org/modules";
}

export function normalizePortalSession(claims: PortalLaunchClaims): PortalSession {
  const roles = Array.isArray(claims.roles) ? claims.roles : [];
  const permissions = getPortalPermissions(roles);

  return {
    portalUserID: String(claims.userID),
    portalProfileID: claims.profileID === undefined ? undefined : String(claims.profileID),
    email: claims.email,
    name: claims.name,
    handle: claims.handle,
    picture: claims.picture,
    roles,
    ...permissions,
    issuedAt: Math.floor(Date.now() / 1000),
  };
}

export async function verifyPortalLaunchToken(token: string) {
  const { payload } = await jwtVerify(token, encodeSecret(requireEnv("PORTAL_MODULE_LAUNCH_SECRET")), {
    algorithms: ["HS256"],
    audience: expectedModuleSlug(),
    issuer: expectedIssuer(),
  });

  const claims = payload as PortalLaunchClaims;

  if (claims.typ !== "portal_module_launch") {
    throw new Error("Invalid Portal launch token type.");
  }

  if (claims.moduleSlug !== expectedModuleSlug()) {
    throw new Error("Invalid Portal module slug.");
  }

  if (claims.userID === undefined || claims.sub === undefined) {
    throw new Error("Invalid Portal launch user identity.");
  }

  return claims;
}

export async function createPortalSessionToken(session: PortalSession) {
  return new SignJWT(session)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${sessionLifetimeSeconds}s`)
    .sign(encodeSecret(requireEnv("PORTAL_MODULE_SESSION_SECRET")));
}

export async function readPortalSessionToken(token: string) {
  const { payload } = await jwtVerify(token, encodeSecret(requireEnv("PORTAL_MODULE_SESSION_SECRET")), {
    algorithms: ["HS256"],
  });

  const claims = payload as PortalSessionClaims;

  if (!claims.portalUserID || !Array.isArray(claims.roles)) {
    return null;
  }

  const permissions = getPortalPermissions(claims.roles);

  return {
    portalUserID: String(claims.portalUserID),
    portalProfileID: claims.portalProfileID,
    email: claims.email,
    name: claims.name,
    handle: claims.handle,
    picture: claims.picture,
    roles: claims.roles,
    ...permissions,
    issuedAt: Number(claims.issuedAt ?? claims.iat ?? 0),
  } satisfies PortalSession;
}

export async function getPortalSession(request: NextRequest) {
  const token = request.cookies.get(portalSessionCookieName)?.value;

  if (!token) {
    return null;
  }

  try {
    return await readPortalSessionToken(token);
  } catch {
    return null;
  }
}

export async function requireViewerSession(request: NextRequest) {
  const session = await getPortalSession(request);

  if (!session) {
    return { session: null, status: 401 as const };
  }

  if (!session.canView) {
    return { session, status: 403 as const };
  }

  return { session, status: 200 as const };
}

export async function requireEditorSession(request: NextRequest) {
  const session = await getPortalSession(request);

  if (!session) {
    return { session: null, status: 401 as const };
  }

  if (!session.canEdit) {
    return { session, status: 403 as const };
  }

  return { session, status: 200 as const };
}

export function portalSessionCookieOptions() {
  return {
    httpOnly: true,
    maxAge: sessionLifetimeSeconds,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
}
