import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedAgentRequest } from "@/lib/api-auth";
import { upsertDraft } from "@/lib/content/queries";
import { agentDraftUpsertSchema } from "@/lib/content/validation";

export async function PUT(request: NextRequest) {
  if (!isAuthorizedAgentRequest(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = agentDraftUpsertSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request.", details: parsed.error.flatten() }, { status: 400 });
  }

  const draft = await upsertDraft({
    ...parsed.data,
    external_source: parsed.data.external_source,
    external_id: parsed.data.external_id,
  });
  return NextResponse.json({ draft });
}
