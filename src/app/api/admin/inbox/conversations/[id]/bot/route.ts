import { NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const r = await queryOne<{ bot_enabled: boolean }>(
    `SELECT bot_enabled FROM sena_ev.conversations WHERE id = $1`,
    [id],
  );
  if (!r) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json({ botEnabled: r.bot_enabled });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await req.json()) as { botEnabled?: boolean };
  if (typeof body.botEnabled !== "boolean") {
    return NextResponse.json(
      { error: "botEnabled (boolean) required" },
      { status: 400 },
    );
  }
  await query(
    `UPDATE sena_ev.conversations
        SET bot_enabled = $2, updated_at = now()
      WHERE id = $1`,
    [id, body.botEnabled],
  );
  return NextResponse.json({ ok: true, botEnabled: body.botEnabled });
}
