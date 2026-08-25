import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedAgentRequest } from "@/lib/api-auth";
import { listTopicAuditEvents } from "@/lib/content/queries";
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAuthorizedAgentRequest(request)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  return NextResponse.json({ audit_events: await listTopicAuditEvents((await params).id) });
}
