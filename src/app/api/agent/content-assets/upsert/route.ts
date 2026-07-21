import { NextRequest, NextResponse } from "next/server";
import {
  getBundleRunByPrismRequestId,
  upsertContentAsset,
} from "@/lib/bundles/queries";
import { upsertContentAssetSchema } from "@/lib/bundles/validation";
import { isAuthorizedAgentRequest } from "@/lib/api-auth";
import { getDraft, getTopic } from "@/lib/content/queries";

export async function PUT(request: NextRequest) {
  if (!isAuthorizedAgentRequest(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = upsertContentAssetSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const [topic, run, draft] = await Promise.all([
    getTopic(parsed.data.topic_id),
    getBundleRunByPrismRequestId(parsed.data.prism_request_id),
    parsed.data.draft_id ? getDraft(parsed.data.draft_id) : null,
  ]);

  if (!topic) {
    return NextResponse.json({ error: "Topic not found." }, { status: 404 });
  }

  if (!run || run.topic_id !== topic.id) {
    return NextResponse.json(
      { error: "Prism request is not linked to this Topic." },
      { status: 409 },
    );
  }

  if (draft && draft.topic_id !== topic.id) {
    return NextResponse.json(
      { error: "Draft is not linked to this Topic." },
      { status: 409 },
    );
  }

  if (parsed.data.draft_id && !draft) {
    return NextResponse.json({ error: "Draft not found." }, { status: 404 });
  }

  const asset = await upsertContentAsset(parsed.data);
  return NextResponse.json({ asset });
}
