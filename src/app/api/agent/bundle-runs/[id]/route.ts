import { NextRequest, NextResponse } from "next/server";
import { getBundleRun, updateBundleRun } from "@/lib/bundles/queries";
import { updateBundleRunSchema } from "@/lib/bundles/validation";
import { isAuthorizedAgentRequest } from "@/lib/api-auth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  if (!isAuthorizedAgentRequest(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await context.params;
  const run = await getBundleRun(id);

  if (!run) {
    return NextResponse.json({ error: "Bundle run not found." }, { status: 404 });
  }

  return NextResponse.json({ run });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  if (!isAuthorizedAgentRequest(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateBundleRunSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { id } = await context.params;
  const run = await updateBundleRun(id, parsed.data);

  if (!run) {
    return NextResponse.json({ error: "Bundle run not found." }, { status: 404 });
  }

  return NextResponse.json({ run });
}
