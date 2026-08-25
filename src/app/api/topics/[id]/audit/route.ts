import { NextRequest, NextResponse } from "next/server";
import { requireViewerSession } from "@/lib/portal-auth";
import { listTopicAuditEvents } from "@/lib/content/queries";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authorization = await requireViewerSession(request);
  if (authorization.status !== 200) return NextResponse.json({ error: authorization.status === 401 ? "Unauthorized." : "Forbidden." }, { status: authorization.status });
  return NextResponse.json({ audit_events: await listTopicAuditEvents((await params).id) });
}
