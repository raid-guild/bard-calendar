import { NextRequest, NextResponse } from "next/server";
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
    const headers = new Headers({
      "cache-control": "private, max-age=300",
      "content-disposition": "inline",
      "content-type":
        upstream.headers.get("content-type") ??
        asset.mime_type ??
        "application/octet-stream",
    });
    const contentLength = upstream.headers.get("content-length");

    if (contentLength) {
      headers.set("content-length", contentLength);
    }

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
