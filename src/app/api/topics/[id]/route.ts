import { NextRequest, NextResponse } from "next/server";
import { deleteTopic, getTopic, updateTopic } from "@/lib/content/queries";
import { topicUpdateSchema } from "@/lib/content/validation";
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
  const topic = await getTopic(id);

  if (!topic) {
    return NextResponse.json({ error: "Topic not found." }, { status: 404 });
  }

  return NextResponse.json({ topic });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const authorization = await requireEditorSession(request);

  if (authorization.status !== 200) {
    return unauthorized(authorization.status);
  }

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = topicUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request.", details: parsed.error.flatten() }, { status: 400 });
  }

  const topic = await updateTopic(id, parsed.data);

  if (!topic) {
    return NextResponse.json({ error: "Topic not found." }, { status: 404 });
  }

  return NextResponse.json({ topic });
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const authorization = await requireEditorSession(request);

  if (authorization.status !== 200) {
    return unauthorized(authorization.status);
  }

  const { id } = await context.params;
  const topic = await deleteTopic(id);

  if (!topic) {
    return NextResponse.json({ error: "Topic not found." }, { status: 404 });
  }

  return NextResponse.json({ topic });
}
