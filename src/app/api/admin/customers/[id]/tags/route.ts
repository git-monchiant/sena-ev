import { NextResponse } from "next/server";
import { addCustomerTag, listCustomerTags } from "@/lib/tags";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const tags = await listCustomerTags(id);
  return NextResponse.json({ tags });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await req.json()) as { tagId?: string; note?: string };
  if (!body.tagId) {
    return NextResponse.json({ error: "tagId required" }, { status: 400 });
  }
  await addCustomerTag({
    customerId: id,
    tagId: body.tagId,
    note: body.note,
  });
  return NextResponse.json({ ok: true });
}
