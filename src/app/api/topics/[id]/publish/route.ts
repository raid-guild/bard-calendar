import { NextRequest, NextResponse } from "next/server";
import { requireEditorSession } from "@/lib/portal-auth";
import { publishTopic } from "@/lib/content/queries";
import { topicPublishSchema } from "@/lib/content/validation";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authorization = await requireEditorSession(request);
  if (authorization.status !== 200) return NextResponse.json({ error: authorization.status === 401 ? "Unauthorized." : "Forbidden." }, { status: authorization.status });
  const body = await request.json().catch(() => null);
  const parsed = topicPublishSchema.safeParse({ ...body, actor: authorization.session?.handle ?? authorization.session?.name ?? authorization.session?.portalUserID });
  if (!parsed.success) return NextResponse.json({ error: "Invalid request.", details: parsed.error.flatten() }, { status: 400 });
  const topic = await publishTopic((await params).id, parsed.data);
  return topic ? NextResponse.json({ topic }) : NextResponse.json({ error: "Topic not found." }, { status: 404 });
}
