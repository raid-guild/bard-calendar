import { NextRequest, NextResponse } from "next/server";
import { addDraftDagger, removeDraftDagger } from "@/lib/content/queries";
import { requireEditorSession } from "@/lib/portal-auth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function unauthorized(status: 401 | 403) {
  return NextResponse.json({ error: status === 401 ? "Unauthorized." : "Forbidden." }, { status });
}

export async function POST(request: NextRequest, context: RouteContext) {
  const authorization = await requireEditorSession(request);

  if (authorization.status !== 200) {
    return unauthorized(authorization.status);
  }

  const { id } = await context.params;
  const draft = await addDraftDagger(
    id,
    authorization.session.portalUserID,
    authorization.session.handle ?? authorization.session.name ?? authorization.session.email,
  );

  if (!draft) {
    return NextResponse.json({ error: "Draft not found." }, { status: 404 });
  }

  return NextResponse.json({ draft });
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const authorization = await requireEditorSession(request);

  if (authorization.status !== 200) {
    return unauthorized(authorization.status);
  }

  const { id } = await context.params;
  const draft = await removeDraftDagger(id, authorization.session.portalUserID);

  if (!draft) {
    return NextResponse.json({ error: "Draft not found." }, { status: 404 });
  }

  return NextResponse.json({ draft });
}
