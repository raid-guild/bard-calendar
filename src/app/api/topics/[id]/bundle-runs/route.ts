import { NextRequest, NextResponse } from "next/server";
import {
  createBundleRun,
  listBundleRuns,
  updateBundleRun,
} from "@/lib/bundles/queries";
import {
  PrismBundleError,
  triggerPrismBundle,
} from "@/lib/bundles/prism-client";
import { createBundleRunSchema } from "@/lib/bundles/validation";
import {
  getTopic,
  getTopicByExternalIdentity,
  updateTopic,
} from "@/lib/content/queries";
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

  const linkedTopic = await getTopicByExternalIdentity(
    parsed.data.source.system,
    parsed.data.source.id,
  );

  if (linkedTopic && linkedTopic.id !== topic.id) {
    return NextResponse.json(
      {
        error: "This Portal post is already linked to another Topic.",
        topic_id: linkedTopic.id,
      },
      { status: 409 },
    );
  }

  const updatedTopic =
    (await updateTopic(topic.id, {
      external_source: parsed.data.source.system,
      external_id: parsed.data.source.id,
      metadata: {
        ...topic.metadata,
        portal_post_id: parsed.data.source.id,
        ...(parsed.data.source.url
          ? { portal_post_url: parsed.data.source.url }
          : {}),
      },
    })) ?? topic;

  const createdBy =
    authorization.session?.handle ??
    authorization.session?.name ??
    authorization.session?.portalUserID;
  const run = await createBundleRun(topic.id, parsed.data, createdBy);

  try {
    const prism = await triggerPrismBundle(updatedTopic, run, parsed.data);
    const dispatched = await updateBundleRun(run.id, {
      prism_request_id: prism.requestId,
      error_message: null,
    });

    return NextResponse.json({ run: dispatched, prism }, { status: 202 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not trigger Prism.";
    const failed = await updateBundleRun(run.id, {
      status: "failed",
      stage: "dispatch",
      error_message: message,
      finished_at: new Date().toISOString(),
    });
    const status = error instanceof PrismBundleError ? error.status : 502;
    const code =
      error instanceof PrismBundleError ? error.code : "PRISM_DISPATCH_FAILED";

    return NextResponse.json(
      { error: message, code, run: failed },
      { status },
    );
  }
}
