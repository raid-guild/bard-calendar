import { NextRequest, NextResponse } from "next/server";
import { createEvent, listEvents } from "@/lib/events/queries";
import { eventCreateSchema, eventListQuerySchema } from "@/lib/events/validation";
import { requireEditorSession, requireViewerSession } from "@/lib/portal-auth";

function zodError(error: unknown) {
  return NextResponse.json({ error: "Invalid request.", details: error }, { status: 400 });
}

export async function GET(request: NextRequest) {
  const authorization = await requireViewerSession(request);

  if (authorization.status !== 200) {
    return NextResponse.json(
      { error: authorization.status === 401 ? "Unauthorized." : "Forbidden." },
      { status: authorization.status },
    );
  }

  const params = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parsed = eventListQuerySchema.safeParse(params);

  if (!parsed.success) {
    return zodError(parsed.error.flatten());
  }

  const events = await listEvents(parsed.data);
  return NextResponse.json({ events });
}

export async function POST(request: NextRequest) {
  const authorization = await requireEditorSession(request);

  if (authorization.status !== 200) {
    return NextResponse.json(
      { error: authorization.status === 401 ? "Unauthorized." : "Forbidden." },
      { status: authorization.status },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = eventCreateSchema.safeParse(body);

  if (!parsed.success) {
    return zodError(parsed.error.flatten());
  }

  const event = await createEvent(parsed.data);
  return NextResponse.json({ event }, { status: 201 });
}
