import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedAgentRequest } from "@/lib/api-auth";
import { updateEvent } from "@/lib/events/queries";
import { eventUpdateSchema } from "@/lib/events/validation";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  if (!isAuthorizedAgentRequest(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
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
