import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedAgentRequest } from "@/lib/api-auth";
import { reopenTopic } from "@/lib/content/queries";
import { topicReopenSchema } from "@/lib/content/validation";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAuthorizedAgentRequest(request)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const parsed = topicReopenSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request.", details: parsed.error.flatten() }, { status: 400 });
  const topic = await reopenTopic((await params).id, parsed.data);
  return topic ? NextResponse.json({ topic }) : NextResponse.json({ error: "Topic not found." }, { status: 404 });
}
