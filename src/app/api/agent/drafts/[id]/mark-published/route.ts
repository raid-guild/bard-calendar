import { NextRequest, NextResponse } from "next/server";
import { markDraftPublished } from "@/lib/content/queries";
import { draftMarkPublishedSchema } from "@/lib/content/validation";
import { LiveUrlConflictError } from "@/lib/events/live-url";
import { isAuthorizedAgentRequest } from "@/lib/api-auth";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  if (!isAuthorizedAgentRequest(request)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const parsed = draftMarkPublishedSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request.", details: parsed.error.flatten() }, { status: 400 });
  try {
    const event = await markDraftPublished((await context.params).id, parsed.data);
    if (!event) return NextResponse.json({ error: "Draft not found." }, { status: 404 });
    return NextResponse.json({ event });
  } catch (error) {
    if (error instanceof LiveUrlConflictError) return NextResponse.json({ error: error.message }, { status: 409 });
    throw error;
  }
}
