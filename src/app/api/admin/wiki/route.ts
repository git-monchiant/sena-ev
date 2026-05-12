import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { upsert } from "@/lib/bot/wiki/shared";
import type { WikiKind } from "@/lib/bot/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const kind = url.searchParams.get("kind");
  const q = url.searchParams.get("q")?.trim();
  const args: unknown[] = [];
  const where: string[] = [];
  if (kind) {
    args.push(kind);
    where.push(`kind = $${args.length}`);
  }
  if (q) {
    args.push(`%${q.toLowerCase()}%`);
    where.push(
      `(LOWER(title) LIKE $${args.length} OR LOWER(slug) LIKE $${args.length} OR LOWER(body_md) LIKE $${args.length})`,
    );
  }
  const whereSql = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";
  const r = await query<{
    id: string;
    slug: string;
    title: string;
    kind: string;
    tags: string[] | null;
    updated_at: string;
  }>(
    `SELECT id, slug, title, kind, tags, updated_at::text
       FROM sena_ev.wiki_pages ${whereSql}
      ORDER BY kind ASC, title ASC
      LIMIT 200`,
    args,
  );
  return NextResponse.json({ pages: r.rows });
}

const KINDS: WikiKind[] = ["product", "policy", "faq", "process", "brand", "note"];

export async function POST(req: Request) {
  const body = (await req.json()) as {
    slug?: string;
    title?: string;
    kind?: string;
    bodyMd?: string;
    tags?: string[];
    aliases?: string[];
  };
  if (!body.slug || !body.title || !body.kind) {
    return NextResponse.json(
      { error: "slug, title, kind required" },
      { status: 400 },
    );
  }
  if (!KINDS.includes(body.kind as WikiKind)) {
    return NextResponse.json(
      { error: `kind must be one of ${KINDS.join(", ")}` },
      { status: 400 },
    );
  }
  const page = await upsert({
    slug: body.slug,
    title: body.title,
    kind: body.kind as WikiKind,
    bodyMd: body.bodyMd ?? "",
    tags: body.tags,
    aliases: body.aliases,
  });
  return NextResponse.json({ page }, { status: 201 });
}
