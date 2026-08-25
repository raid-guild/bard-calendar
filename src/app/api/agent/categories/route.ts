import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedAgentRequest } from "@/lib/api-auth";
import { createCategory, listCategories } from "@/lib/content/queries";
import { categoryCreateSchema } from "@/lib/content/validation";
export async function GET(request: NextRequest) {
  if (!isAuthorizedAgentRequest(request)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  return NextResponse.json({ categories: await listCategories(request.nextUrl.searchParams.get("include_inactive") === "true") });
}
export async function POST(request: NextRequest) {
  if (!isAuthorizedAgentRequest(request)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const parsed = categoryCreateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request.", details: parsed.error.flatten() }, { status: 400 });
  return NextResponse.json({ category: await createCategory(parsed.data) }, { status: 201 });
}
