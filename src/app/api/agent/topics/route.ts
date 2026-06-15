import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedAgentRequest } from "@/lib/api-auth";
import { createTopic, listTopics } from "@/lib/content/queries";
import { topicCreateSchema, topicListQuerySchema } from "@/lib/content/validation";

export async function GET(request: NextRequest) {
  if (!isAuthorizedAgentRequest(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const parsed = topicListQuerySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams.entries()));

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request.", details: parsed.error.flatten() }, { status: 400 });
  }

  const topics = await listTopics(parsed.data);
  return NextResponse.json({ topics });
}

export async function POST(request: NextRequest) {
  if (!isAuthorizedAgentRequest(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = topicCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request.", details: parsed.error.flatten() }, { status: 400 });
  }

  const topic = await createTopic(parsed.data);
  return NextResponse.json({ topic }, { status: 201 });
}
