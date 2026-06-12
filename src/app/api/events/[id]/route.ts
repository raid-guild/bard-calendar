import { NextRequest, NextResponse } from "next/server";
import { deleteEvent, updateEvent } from "@/lib/events/queries";
import { eventUpdateSchema } from "@/lib/events/validation";
import { requireEditorSession } from "@/lib/portal-auth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const authorization = await requireEditorSession(request);

  if (authorization.status !== 200) {
    return NextResponse.json(
      { error: authorization.status === 401 ? "Unauthorized." : "Forbidden." },
      { status: authorization.status },
    );
  }

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = eventUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const event = await updateEvent(id, parsed.data);

  if (!event) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }

  return NextResponse.json({ event });
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const authorization = await requireEditorSession(request);

  if (authorization.status !== 200) {
    return NextResponse.json(
      { error: authorization.status === 401 ? "Unauthorized." : "Forbidden." },
      { status: authorization.status },
    );
  }

  const { id } = await context.params;
  const event = await deleteEvent(id);

  if (!event) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }

  return NextResponse.json({ event });
}
