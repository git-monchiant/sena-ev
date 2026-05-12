import { NextResponse } from "next/server";
import { seedSharedWiki, wikiSummary } from "@/lib/bot/seed";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const result = await seedSharedWiki();
  const summary = await wikiSummary();
  return NextResponse.json({ ok: true, ...result, byKind: summary });
}

export async function GET() {
  const summary = await wikiSummary();
  return NextResponse.json({ byKind: summary });
}
