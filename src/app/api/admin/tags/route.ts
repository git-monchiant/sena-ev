import { NextResponse } from "next/server";
import { createTag, listAllTags, type TagCategory } from "@/lib/tags";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const tags = await listAllTags();
  return NextResponse.json({ tags });
}

export async function POST(req: Request) {
  const body = (await req.json()) as {
    name?: string;
    category?: TagCategory;
    color?: string;
    description?: string;
  };
  if (!body.name?.trim() || !body.category) {
    return NextResponse.json(
      { error: "name and category required" },
      { status: 400 },
    );
  }
  const tag = await createTag({
    name: body.name.trim(),
    category: body.category,
    color: body.color,
    description: body.description,
  });
  return NextResponse.json({ tag });
}
