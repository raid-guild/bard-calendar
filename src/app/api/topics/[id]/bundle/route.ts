import { NextRequest, NextResponse } from "next/server";
import { listBundleRuns, listContentAssets } from "@/lib/bundles/queries";
import { getTopic, listDrafts } from "@/lib/content/queries";
import { requireViewerSession } from "@/lib/portal-auth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const authorization = await requireViewerSession(request);

  if (authorization.status !== 200) {
    return NextResponse.json(
      { error: authorization.status === 401 ? "Unauthorized." : "Forbidden." },
      { status: authorization.status },
    );
  }

  const { id } = await context.params;
  const topic = await getTopic(id);

  if (!topic) {
    return NextResponse.json({ error: "Topic not found." }, { status: 404 });
  }

  const [drafts, runs, assets] = await Promise.all([
    listDrafts({ topic_id: id }, authorization.session?.portalUserID),
    listBundleRuns(id),
    listContentAssets(id),
  ]);

  return NextResponse.json({
    bundle: {
      topic,
      drafts,
      runs,
      assets,
      latest_run: runs[0] ?? null,
    },
  });
}
