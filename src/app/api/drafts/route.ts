import { NextRequest, NextResponse } from "next/server";
import { createDraft, listDrafts } from "@/lib/content/queries";
import { draftCreateSchema, draftListQuerySchema } from "@/lib/content/validation";
import { requireEditorSession, requireViewerSession } from "@/lib/portal-auth";

function unauthorized(status: 401 | 403) {
  return NextResponse.json({ error: status === 401 ? "Unauthorized." : "Forbidden." }, { status });
}

export async function GET(request: NextRequest) {
  const authorization = await requireViewerSession(request);

  if (authorization.status !== 200) {
    return unauthorized(authorization.status);
  }

  const parsed = draftListQuerySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams.entries()));

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request.", details: parsed.error.flatten() }, { status: 400 });
  }

  const drafts = await listDrafts(parsed.data, authorization.session?.portalUserID);
  return NextResponse.json({ drafts });
}

export async function POST(request: NextRequest) {
  const authorization = await requireEditorSession(request);

  if (authorization.status !== 200) {
    return unauthorized(authorization.status);
  }

  const body = await request.json().catch(() => null);
  const parsed = draftCreateSchema.safeParse({
    ...body,
    created_by: body?.created_by ?? authorization.session?.handle ?? authorization.session?.name ?? authorization.session?.portalUserID,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request.", details: parsed.error.flatten() }, { status: 400 });
  }

  const draft = await createDraft(parsed.data);
  return NextResponse.json({ draft }, { status: 201 });
}
