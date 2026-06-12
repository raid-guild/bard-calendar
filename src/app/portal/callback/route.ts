import { NextRequest, NextResponse } from "next/server";
import {
  createPortalSessionToken,
  normalizePortalSession,
  portalSessionCookieName,
  portalSessionCookieOptions,
  verifyPortalLaunchToken,
} from "@/lib/portal-auth";

function redirectHome(request: NextRequest, status: string) {
  return NextResponse.redirect(new URL(`/?portal_launch=${status}`, request.url));
}

function safeErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown Portal launch error.";
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    const response = redirectHome(request, "missing");
    response.cookies.delete(portalSessionCookieName);
    return response;
  }

  try {
    const claims = await verifyPortalLaunchToken(token);
    const session = normalizePortalSession(claims);
    const sessionToken = await createPortalSessionToken(session);
    const response = redirectHome(request, "ok");

    response.cookies.set(portalSessionCookieName, sessionToken, portalSessionCookieOptions());
    return response;
  } catch (error) {
    console.warn("Portal launch failed.", {
      error: safeErrorMessage(error),
      hasToken: true,
      host: request.nextUrl.host,
      path: request.nextUrl.pathname,
    });

    const response = redirectHome(request, "invalid");
    response.cookies.delete(portalSessionCookieName);
    return response;
  }
}
