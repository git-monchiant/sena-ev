import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Read-only graph payload for the admin Obsidian-style wiki viewer.
 *
 * Node sources (no DB writes anywhere — all derived):
 *   1. wiki_pages rows (group="wiki", colored by kind)
 *   2. car_models / showrooms / promotions referenced by a wiki page
 *      or wiki_edges row (group="car"/"showroom"/"promo")
 *   3. virtual "subtopic" nodes for each `## heading` inside body_md
 *      (group="subtopic"), one per heading
 *
 * Edge sources:
 *   - wiki_page → entity, relation="represents" (from ref_table+ref_id)
 *   - wiki_page → subtopic, relation="section"
 *   - wiki_page → wiki_page, relation="mentions" (slug / title / alias
 *     match in body_md, scanned at request time)
 *   - any wiki_edges row whose endpoints are present in node set
 *
 * Does NOT mutate anything. Does NOT touch the bot's read path.
 */

type Node = {
  id: string;
  kind: string;
  group: string;
  label: string;
  slug: string | null;
  parentId?: string;
  isPublished?: boolean;
};

type Edge = {
  source: string;
  target: string;
  relation: string;
};

type WikiRow = {
  id: string;
  slug: string;
  title: string;
  kind: string;
  body_md: string;
  aliases: string[] | null;
  is_published: boolean;
  ref_table: string | null;
  ref_id: string | null;
};

function extractSubtopics(body: string): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const line of body.split(/\r?\n/)) {
    const m = /^##\s+(.+?)\s*$/.exec(line.trim());
    if (!m) continue;
    const text = m[1].replace(/[`*_]/g, "").trim();
    if (!text || seen.has(text)) continue;
    seen.add(text);
    out.push(text);
  }
  return out;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET() {
  const [wikiRows, edgeRows] = await Promise.all([
    query<WikiRow>(
      `SELECT id, slug, title, kind, body_md, aliases, is_published,
              ref_table, ref_id
         FROM sena_ev.wiki_pages
        ORDER BY title ASC`,
    ),
    query<{
      from_kind: string;
      from_id: string;
      to_kind: string;
      to_id: string;
      relation: string;
    }>(
      `SELECT from_kind, from_id, to_kind, to_id, relation
         FROM sena_ev.wiki_edges`,
    ),
  ]);

  const nodes = new Map<string, Node>();
  const edges: Edge[] = [];

  // 1. wiki page nodes
  for (const r of wikiRows.rows) {
    nodes.set(r.id, {
      id: r.id,
      kind: r.kind,
      group: "wiki",
      label: r.title,
      slug: r.slug,
      isPublished: r.is_published,
    });
  }

  // 2. virtual subtopic nodes + edges
  for (const r of wikiRows.rows) {
    const subs = extractSubtopics(r.body_md);
    subs.forEach((heading, idx) => {
      const subId = `${r.id}::section-${idx}`;
      nodes.set(subId, {
        id: subId,
        kind: "section",
        group: "subtopic",
        label: heading,
        slug: null,
        parentId: r.id,
      });
      edges.push({ source: r.id, target: subId, relation: "section" });
    });
  }

  // 3. cross-reference edges via slug / title / alias mentions in body
  // Build a lookup keyed by the lowered matchable token → pageId
  type Token = { token: string; pageId: string };
  const tokens: Token[] = [];
  for (const r of wikiRows.rows) {
    const cands = new Set<string>();
    cands.add(r.slug.toLowerCase());
    if (r.title) cands.add(r.title.toLowerCase());
    for (const a of r.aliases ?? []) {
      const v = a.trim().toLowerCase();
      if (v.length >= 3) cands.add(v); // skip very short aliases
    }
    for (const c of cands) tokens.push({ token: c, pageId: r.id });
  }
  // Sort longer-first so "deepal-s07" matches before "deepal"
  tokens.sort((a, b) => b.token.length - a.token.length);

  for (const a of wikiRows.rows) {
    const haystack = a.body_md.toLowerCase();
    const linked = new Set<string>();
    for (const { token, pageId } of tokens) {
      if (pageId === a.id) continue; // skip self
      if (linked.has(pageId)) continue; // already linked from this page
      // word-boundary match — treat `-` as boundary so "car-deepal-s07"
      // still matches if it appears inside other text
      const rx = new RegExp(
        `(?:^|[^a-z0-9_-])${escapeRegex(token)}(?:$|[^a-z0-9_-])`,
        "i",
      );
      if (rx.test(haystack)) {
        edges.push({ source: a.id, target: pageId, relation: "mentions" });
        linked.add(pageId);
      }
    }
  }

  // 4. Build entity → wiki page indirection. A wiki page that REPRESENTS
  // a structured entity becomes THE node for that entity — we don't
  // create a duplicate "entity" node beside its wiki page. This collapses
  // the redundant green/blue double-cluster you'd otherwise see.
  const entityToWiki = new Map<string, string>(); // entityId → wikiPageId
  for (const r of wikiRows.rows) {
    if (r.ref_id) entityToWiki.set(r.ref_id, r.id);
  }
  // Resolve any entity id through the indirection map (or return as-is)
  const resolve = (id: string): string => entityToWiki.get(id) ?? id;

  // Collect entity IDs that need NEW nodes (no wiki page exists for them yet)
  const carIds = new Set<string>();
  const showroomIds = new Set<string>();
  const promoIds = new Set<string>();

  // Always fetch all referenced entities so we still know brand/etc
  // information for wiki pages that DO represent them (used for brand
  // grouping below). We'll just skip creating a node when a wiki rep exists.
  for (const e of edgeRows.rows) {
    const add = (kind: string, id: string) => {
      if (kind === "car_model") carIds.add(id);
      else if (kind === "showroom") showroomIds.add(id);
      else if (kind === "promotion") promoIds.add(id);
    };
    add(e.from_kind, e.from_id);
    add(e.to_kind, e.to_id);
  }
  // Also include entities referenced by wiki pages — needed for metadata
  // lookup (e.g. car brand) even though we won't create a separate node.
  for (const r of wikiRows.rows) {
    if (!r.ref_id || !r.ref_table) continue;
    if (r.ref_table === "car_models") carIds.add(r.ref_id);
    else if (r.ref_table === "showrooms") showroomIds.add(r.ref_id);
    else if (r.ref_table === "promotions") promoIds.add(r.ref_id);
  }

  // ──── Hierarchy roots (virtual nodes — not in DB) ────
  // Synthetic root nodes group entity nodes into taxonomy: รถ → brand →
  // model, etc. Stable IDs so the force layout doesn't jitter between
  // requests.
  const ROOT_CAR = "root::cars";
  const ROOT_SHOWROOM = "root::showrooms";
  const ROOT_PROMO = "root::promos";

  if (carIds.size > 0) {
    const r = await query<{
      id: string;
      name: string;
      brand: string;
      slug: string;
    }>(
      `SELECT id, name, brand, slug FROM sena_ev.car_models
        WHERE id = ANY($1::uuid[])`,
      [[...carIds]],
    );
    if (r.rows.length > 0) {
      nodes.set(ROOT_CAR, {
        id: ROOT_CAR,
        kind: "category",
        group: "category",
        label: "รถ EV",
        slug: null,
      });
    }
    // Brand nodes (one per distinct brand)
    const brandIds = new Map<string, string>();
    for (const row of r.rows) {
      const brand = row.brand.trim();
      if (!brand) continue;
      const brandId = `brand::${brand.toLowerCase()}`;
      if (!brandIds.has(brand)) {
        brandIds.set(brand, brandId);
        nodes.set(brandId, {
          id: brandId,
          kind: "brand",
          group: "category",
          label: brand,
          slug: null,
        });
        edges.push({
          source: ROOT_CAR,
          target: brandId,
          relation: "category",
        });
      }
    }
    for (const row of r.rows) {
      const wikiId = entityToWiki.get(row.id);
      // If a wiki page represents this car, use IT as the node (don't
      // create a duplicate). Otherwise create a thin "car" node so the
      // brand still has a visible child.
      const nodeId = wikiId ?? row.id;
      if (!wikiId) {
        const branded = row.name
          .toUpperCase()
          .startsWith(row.brand.toUpperCase())
          ? row.name
          : `${row.brand} ${row.name}`;
        nodes.set(row.id, {
          id: row.id,
          kind: "car_model",
          group: "car",
          label: branded,
          slug: row.slug,
        });
      }
      const brandId = brandIds.get(row.brand.trim());
      if (brandId && nodes.has(nodeId)) {
        edges.push({ source: brandId, target: nodeId, relation: "model" });
      }
    }
  }

  if (showroomIds.size > 0) {
    const r = await query<{ id: string; name: string; slug: string }>(
      `SELECT id, name, slug FROM sena_ev.showrooms WHERE id = ANY($1::uuid[])`,
      [[...showroomIds]],
    );
    if (r.rows.length > 0) {
      nodes.set(ROOT_SHOWROOM, {
        id: ROOT_SHOWROOM,
        kind: "category",
        group: "category",
        label: "โชว์รูม",
        slug: null,
      });
    }
    for (const row of r.rows) {
      const wikiId = entityToWiki.get(row.id);
      const nodeId = wikiId ?? row.id;
      if (!wikiId) {
        nodes.set(row.id, {
          id: row.id,
          kind: "showroom",
          group: "showroom",
          label: row.name,
          slug: row.slug,
        });
      }
      if (nodes.has(nodeId)) {
        edges.push({
          source: ROOT_SHOWROOM,
          target: nodeId,
          relation: "branch",
        });
      }
    }
  }

  if (promoIds.size > 0) {
    const r = await query<{
      id: string;
      title: string;
      slug: string;
      applicable_model_ids: string[] | null;
    }>(
      `SELECT id, title, slug, applicable_model_ids
         FROM sena_ev.promotions WHERE id = ANY($1::uuid[])`,
      [[...promoIds]],
    );
    if (r.rows.length > 0) {
      nodes.set(ROOT_PROMO, {
        id: ROOT_PROMO,
        kind: "category",
        group: "category",
        label: "โปรโมชั่น",
        slug: null,
      });
    }
    for (const row of r.rows) {
      const wikiId = entityToWiki.get(row.id);
      const nodeId = wikiId ?? row.id;
      if (!wikiId) {
        nodes.set(row.id, {
          id: row.id,
          kind: "promotion",
          group: "promo",
          label: row.title,
          slug: row.slug,
        });
      }
      if (nodes.has(nodeId)) {
        edges.push({
          source: ROOT_PROMO,
          target: nodeId,
          relation: "offer",
        });
      }

      const applicable = row.applicable_model_ids ?? [];
      if (applicable.length > 0) {
        for (const modelId of applicable) {
          const targetId = resolve(modelId);
          if (nodes.has(targetId)) {
            edges.push({
              source: nodeId,
              target: targetId,
              relation: "applies-to",
            });
          }
        }
      } else if (nodes.has(ROOT_CAR)) {
        edges.push({
          source: nodeId,
          target: ROOT_CAR,
          relation: "applies-to",
        });
      }
    }
  }

  // 5. explicit wiki_edges (route entity ids through the wiki indirection
  // so promo wiki page → car wiki page directly, no detour through the
  // structured entity).
  for (const e of edgeRows.rows) {
    const from = resolve(e.from_id);
    const to = resolve(e.to_id);
    if (from === to) continue;
    if (nodes.has(from) && nodes.has(to)) {
      edges.push({ source: from, target: to, relation: e.relation });
    }
  }

  return NextResponse.json({
    nodes: [...nodes.values()],
    edges,
  });
}
