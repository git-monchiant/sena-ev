import "server-only";
import { query } from "../../db";
import type { EdgeRelation, NodeKind, WikiEdge } from "../types";

type Row = {
  id: string;
  from_kind: NodeKind;
  from_id: string;
  to_kind: NodeKind;
  to_id: string;
  relation: EdgeRelation;
  weight: number;
  note: string | null;
  source: string | null;
};

function toEdge(r: Row): WikiEdge {
  return {
    id: r.id,
    fromKind: r.from_kind,
    fromId: r.from_id,
    toKind: r.to_kind,
    toId: r.to_id,
    relation: r.relation,
    weight: r.weight,
    note: r.note,
    source: r.source,
  };
}

export async function listOut(
  fromKind: NodeKind,
  fromId: string,
): Promise<WikiEdge[]> {
  const r = await query<Row>(
    `SELECT id, from_kind, from_id, to_kind, to_id, relation, weight, note, source
       FROM sena_ev.wiki_edges
      WHERE from_kind = $1 AND from_id = $2
      ORDER BY weight DESC, created_at DESC`,
    [fromKind, fromId],
  );
  return r.rows.map(toEdge);
}

export async function listIn(
  toKind: NodeKind,
  toId: string,
): Promise<WikiEdge[]> {
  const r = await query<Row>(
    `SELECT id, from_kind, from_id, to_kind, to_id, relation, weight, note, source
       FROM sena_ev.wiki_edges
      WHERE to_kind = $1 AND to_id = $2
      ORDER BY weight DESC, created_at DESC`,
    [toKind, toId],
  );
  return r.rows.map(toEdge);
}

export type EdgeInput = {
  fromKind: NodeKind;
  fromId: string;
  toKind: NodeKind;
  toId: string;
  relation: EdgeRelation;
  weight?: number;
  note?: string | null;
  source?: string | null;
};

export async function upsert(input: EdgeInput): Promise<void> {
  await query(
    `INSERT INTO sena_ev.wiki_edges
       (from_kind, from_id, to_kind, to_id, relation, weight, note, source)
     VALUES ($1, $2, $3, $4, $5, COALESCE($6, 1.0), $7, $8)
     ON CONFLICT (from_kind, from_id, to_kind, to_id, relation)
     DO UPDATE SET
       weight = GREATEST(sena_ev.wiki_edges.weight, EXCLUDED.weight),
       note   = COALESCE(EXCLUDED.note, sena_ev.wiki_edges.note),
       source = COALESCE(EXCLUDED.source, sena_ev.wiki_edges.source)`,
    [
      input.fromKind,
      input.fromId,
      input.toKind,
      input.toId,
      input.relation,
      input.weight ?? null,
      input.note ?? null,
      input.source ?? null,
    ],
  );
}

export async function remove(
  fromKind: NodeKind,
  fromId: string,
  toKind: NodeKind,
  toId: string,
  relation: EdgeRelation,
): Promise<void> {
  await query(
    `DELETE FROM sena_ev.wiki_edges
      WHERE from_kind = $1 AND from_id = $2
        AND to_kind   = $3 AND to_id   = $4
        AND relation  = $5`,
    [fromKind, fromId, toKind, toId, relation],
  );
}

/* ─────────── Wikilink parsing (Obsidian-style) ─────────── */

/**
 * Extract `[[link]]` or `[[link|alias]]` from markdown.
 * Returns unique link targets (lower-cased).
 */
export function extractWikilinks(md: string): string[] {
  const re = /\[\[([^\]\n|]+)(?:\|[^\]\n]+)?\]\]/g;
  const out = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = re.exec(md))) {
    const target = m[1]!.trim();
    if (target) out.add(target);
  }
  return [...out];
}
