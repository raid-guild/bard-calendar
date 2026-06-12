import { NextRequest, NextResponse } from "next/server";
import { getPortalSession, portalModulesUrl } from "@/lib/portal-auth";

export async function GET(request: NextRequest) {
  const session = await getPortalSession(request);

  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized.", portalModulesUrl: portalModulesUrl() },
      { status: 401 },
    );
  }

  return NextResponse.json({
    user: {
      portalUserID: session.portalUserID,
      portalProfileID: session.portalProfileID,
      email: session.email,
      name: session.name,
      handle: session.handle,
      picture: session.picture,
      roles: session.roles,
    },
    canView: session.canView,
    canEdit: session.canEdit,
    portalModulesUrl: portalModulesUrl(),
  });
}
