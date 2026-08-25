import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedAgentRequest } from "@/lib/api-auth";
import { BundleOrchestrationError, createAndDispatchBundleRun } from "@/lib/bundles/orchestration";
import { createBundleRunSchema } from "@/lib/bundles/validation";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  if (!isAuthorizedAgentRequest(request)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const body = await request.json().catch(() => null);
  const parsed = createBundleRunSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request.", details: parsed.error.flatten() }, { status: 400 });
  const { id } = await context.params;
  try {
    const result = await createAndDispatchBundleRun(id, parsed.data, "agent");
    return NextResponse.json(result, { status: result.replayed ? 200 : 202 });
  } catch (error) {
    if (error instanceof BundleOrchestrationError) return NextResponse.json({ error: error.message, code: error.code, details: error.details }, { status: error.status });
    throw error;
  }
}
