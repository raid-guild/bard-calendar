import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedAgentRequest } from "@/lib/api-auth";
import { deleteDraft, getDraft, updateDraft } from "@/lib/content/queries";
import { draftUpdateSchema } from "@/lib/content/validation";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  if (!isAuthorizedAgentRequest(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
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

export async function GET(request: NextRequest, context: RouteContext) {
  if (!isAuthorizedAgentRequest(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await context.params;
  const draft = await getDraft(id);

  if (!draft) {
    return NextResponse.json({ error: "Draft not found." }, { status: 404 });
  }

  return NextResponse.json({ draft });
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  if (!isAuthorizedAgentRequest(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await context.params;
  const draft = await deleteDraft(id);

  if (!draft) {
    return NextResponse.json({ error: "Draft not found." }, { status: 404 });
  }

  return NextResponse.json({ draft });
}
