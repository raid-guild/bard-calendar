import { NextRequest, NextResponse } from "next/server";
import { getBundleRun } from "@/lib/bundles/queries";
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
  const run = await getBundleRun(id);

  if (!run) {
    return NextResponse.json({ error: "Bundle run not found." }, { status: 404 });
  }

  return NextResponse.json({ run });
}
