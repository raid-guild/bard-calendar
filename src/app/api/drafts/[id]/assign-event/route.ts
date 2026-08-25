import { NextRequest, NextResponse } from "next/server";
import { assignDraftToEvent } from "@/lib/content/queries";
import { draftAssignEventSchema } from "@/lib/content/validation";
import { requireEditorSession } from "@/lib/portal-auth";
import { EditorialGateError } from "@/lib/content/editorial-gates";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const authorization = await requireEditorSession(request);

  if (authorization.status !== 200) {
    return NextResponse.json(
      { error: authorization.status === 401 ? "Unauthorized." : "Forbidden." },
      { status: authorization.status },
    );
  }

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = draftAssignEventSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request.", details: parsed.error.flatten() }, { status: 400 });
  }

  let event;
  try { event = await assignDraftToEvent(id, parsed.data); }
  catch (error) {
    if (error instanceof EditorialGateError) return NextResponse.json({ error: error.message, code: error.code, blockers: error.blockers }, { status: error.status });
    throw error;
  }

  if (!event) {
    return NextResponse.json({ error: "Draft not found." }, { status: 404 });
  }

  return NextResponse.json({ event }, { status: 201 });
}
