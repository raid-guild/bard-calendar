import { NextRequest, NextResponse } from "next/server";
import { deleteDraft, getDraft, updateDraft } from "@/lib/content/queries";
import { draftUpdateSchema } from "@/lib/content/validation";
import { requireEditorSession, requireViewerSession } from "@/lib/portal-auth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function unauthorized(status: 401 | 403) {
  return NextResponse.json({ error: status === 401 ? "Unauthorized." : "Forbidden." }, { status });
}

export async function GET(request: NextRequest, context: RouteContext) {
  const authorization = await requireViewerSession(request);

  if (authorization.status !== 200) {
    return unauthorized(authorization.status);
  }

  const { id } = await context.params;
  const draft = await getDraft(id, authorization.session?.portalUserID);

  if (!draft) {
    return NextResponse.json({ error: "Draft not found." }, { status: 404 });
  }

  return NextResponse.json({ draft });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const authorization = await requireEditorSession(request);

  if (authorization.status !== 200) {
    return unauthorized(authorization.status);
  }

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = draftUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request.", details: parsed.error.flatten() }, { status: 400 });
  }

  const draft = await updateDraft(id, parsed.data);

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
  const draft = await deleteDraft(id);

  if (!draft) {
    return NextResponse.json({ error: "Draft not found." }, { status: 404 });
  }

  return NextResponse.json({ draft });
}
