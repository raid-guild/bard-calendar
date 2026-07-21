import { NextRequest, NextResponse } from "next/server";
import { artifactResponseHeaders } from "@/lib/bundles/artifact-response";
import { fetchPrismArtifactContent, PrismBundleError } from "@/lib/bundles/prism-client";
import { getContentAsset } from "@/lib/bundles/queries";
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
  const asset = await getContentAsset(id);

  if (!asset) {
    return NextResponse.json({ error: "Content asset not found." }, { status: 404 });
  }

  try {
    const upstream = await fetchPrismArtifactContent(
      asset.prism_request_id,
      asset.prism_artifact_id,
    );
    const headers = artifactResponseHeaders(upstream.headers, asset.mime_type);

    return new NextResponse(upstream.body, { headers });
  } catch (error) {
    const status = error instanceof PrismBundleError ? error.status : 502;
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not load the content asset.",
      },
      { status },
    );
  }
}
