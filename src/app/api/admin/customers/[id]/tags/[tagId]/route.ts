import { NextResponse } from "next/server";
import { removeCustomerTag } from "@/lib/tags";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; tagId: string }> },
) {
  const { id, tagId } = await params;
  await removeCustomerTag(id, tagId);
  return NextResponse.json({ ok: true });
}
