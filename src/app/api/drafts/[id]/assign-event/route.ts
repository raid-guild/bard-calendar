import { NextRequest, NextResponse } from "next/server";
import { assignDraftToEvent } from "@/lib/content/queries";
import { draftAssignEventSchema } from "@/lib/content/validation";
import { requireEditorSession } from "@/lib/portal-auth";

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

  const event = await assignDraftToEvent(id, parsed.data);

  if (!event) {
    return NextResponse.json({ error: "Draft not found." }, { status: 404 });
  }

  return NextResponse.json({ event }, { status: 201 });
}
