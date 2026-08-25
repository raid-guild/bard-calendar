import { NextRequest, NextResponse } from "next/server";
import { requireEditorSession, requireViewerSession } from "@/lib/portal-auth";
import { createCategory, listCategories } from "@/lib/content/queries";
import { categoryCreateSchema } from "@/lib/content/validation";

export async function GET(request: NextRequest) {
  const authorization = await requireViewerSession(request);
  if (authorization.status !== 200) return NextResponse.json({ error: authorization.status === 401 ? "Unauthorized." : "Forbidden." }, { status: authorization.status });
  return NextResponse.json({ categories: await listCategories(request.nextUrl.searchParams.get("include_inactive") === "true") });
}
export async function POST(request: NextRequest) {
  const authorization = await requireEditorSession(request);
  if (authorization.status !== 200) return NextResponse.json({ error: authorization.status === 401 ? "Unauthorized." : "Forbidden." }, { status: authorization.status });
  const parsed = categoryCreateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request.", details: parsed.error.flatten() }, { status: 400 });
  return NextResponse.json({ category: await createCategory(parsed.data) }, { status: 201 });
}
