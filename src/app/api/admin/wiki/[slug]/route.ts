import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import {
  getBySlug,
  remove as removeShared,
  upsert as upsertShared,
} from "@/lib/bot/wiki/shared";
import {
  extractWikilinks,
  listIn,
  remove as removeEdge,
  upsert as upsertEdge,
} from "@/lib/bot/wiki/edges";
import type { WikiKind } from "@/lib/bot/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KINDS: WikiKind[] = [
  "product",
  "policy",
  "faq",
  "process",
  "brand",
  "note",
];

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const page = await getBySlug(slug);
  if (!page) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  // Backlinks: wiki_edges where to_id = page.id AND to_kind = 'wiki_page'
  const incoming = await listIn("wiki_page", page.id);
  const incomingIds = incoming.map((e) => e.fromId);
  let backlinks: { slug: string; title: string }[] = [];
  if (incomingIds.length > 0) {
    const r = await query<{ slug: string; title: string }>(
      `SELECT slug, title FROM sena_ev.wiki_pages WHERE id = ANY($1::uuid[])`,
      [incomingIds],
    );
    backlinks = r.rows;
  }
  // Outgoing edges of this page (where it links out)
  const outgoing = await query<{
    to_slug: string;
    to_title: string;
    relation: string;
  }>(
    `SELECT w2.slug AS to_slug, w2.title AS to_title, e.relation
       FROM sena_ev.wiki_edges e
       JOIN sena_ev.wiki_pages w2
         ON w2.id = e.to_id AND e.to_kind = 'wiki_page'
      WHERE e.from_kind = 'wiki_page' AND e.from_id = $1`,
    [page.id],
  );

  return NextResponse.json({
    page,
    backlinks,
    outgoing: outgoing.rows,
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const existing = await getBySlug(slug);
  if (!existing) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const body = (await req.json()) as {
    title?: string;
    kind?: string;
    bodyMd?: string;
    tags?: string[];
    aliases?: string[];
    isPublished?: boolean;
  };
  if (body.kind && !KINDS.includes(body.kind as WikiKind)) {
    return NextResponse.json(
      { error: `kind must be one of ${KINDS.join(", ")}` },
      { status: 400 },
    );
  }

  const next = await upsertShared({
    slug,
    title: body.title ?? existing.title,
    kind: (body.kind as WikiKind) ?? existing.kind,
    bodyMd: body.bodyMd ?? existing.bodyMd,
    tags: body.tags ?? existing.tags,
    aliases: body.aliases ?? existing.aliases,
    refTable: existing.refTable,
    refId: existing.refId,
    isPublished:
      body.isPublished !== undefined ? body.isPublished : existing.isPublished,
  });

  // Re-parse [[wikilinks]] and sync edges (auto, source='auto')
  if (body.bodyMd !== undefined) {
    await syncWikilinkEdges(next.id, body.bodyMd ?? "");
  }

  return NextResponse.json({ page: next });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  await removeShared(slug);
  return NextResponse.json({ ok: true });
}

async function syncWikilinkEdges(
  fromPageId: string,
  bodyMd: string,
): Promise<void> {
  const links = extractWikilinks(bodyMd);

  // Drop existing auto edges from this page
  await query(
    `DELETE FROM sena_ev.wiki_edges
      WHERE from_kind = 'wiki_page' AND from_id = $1
        AND relation  = 'related_to' AND source = 'auto'`,
    [fromPageId],
  );

  for (const target of links) {
    const r = await query<{ id: string }>(
      `SELECT id FROM sena_ev.wiki_pages
        WHERE slug = $1 OR title = $1 OR $1 = ANY(aliases)
        LIMIT 1`,
      [target],
    );
    const tid = r.rows[0]?.id;
    if (!tid) continue;
    await upsertEdge({
      fromKind: "wiki_page",
      fromId: fromPageId,
      toKind: "wiki_page",
      toId: tid,
      relation: "related_to",
      source: "auto",
    });
  }
  // Use removeEdge to satisfy import (kept for future use)
  void removeEdge;
}
