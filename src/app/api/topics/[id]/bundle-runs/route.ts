import { NextRequest, NextResponse } from "next/server";
import { listBundleRuns } from "@/lib/bundles/queries";
import { BundleOrchestrationError, createAndDispatchBundleRun } from "@/lib/bundles/orchestration";
import { createBundleRunSchema } from "@/lib/bundles/validation";
import { getTopic } from "@/lib/content/queries";
import {
  requireEditorSession,
  requireViewerSession,
} from "@/lib/portal-auth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function unauthorized(status: 401 | 403) {
  return NextResponse.json(
    { error: status === 401 ? "Unauthorized." : "Forbidden." },
    { status },
  );
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

  return NextResponse.json({ runs: await listBundleRuns(id) });
}

export async function POST(request: NextRequest, context: RouteContext) {
  const authorization = await requireEditorSession(request);

  if (authorization.status !== 200) {
    return unauthorized(authorization.status);
  }

  const { id } = await context.params;
  const topic = await getTopic(id);

  if (!topic) {
    return NextResponse.json({ error: "Topic not found." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createBundleRunSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const createdBy =
    authorization.session?.handle ??
    authorization.session?.name ??
    authorization.session?.portalUserID;
  try {
    const result = await createAndDispatchBundleRun(topic.id, parsed.data, createdBy);
    return NextResponse.json(result, { status: result.replayed ? 200 : 202 });
  } catch (error) {
    if (error instanceof BundleOrchestrationError) return NextResponse.json({ error: error.message, code: error.code, details: error.details }, { status: error.status });
    throw error;
  }
}
