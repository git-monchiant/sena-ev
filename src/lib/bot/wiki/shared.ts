import "server-only";
import { query, queryOne } from "../../db";
import type { WikiKind, WikiPage } from "../types";

type Row = {
  id: string;
  slug: string;
  title: string;
  kind: WikiKind;
  body_md: string;
  tags: string[] | null;
  aliases: string[] | null;
  ref_table: string | null;
  ref_id: string | null;
  is_published: boolean;
  updated_at: string;
};

function toPage(r: Row): WikiPage {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    kind: r.kind,
    bodyMd: r.body_md,
    tags: r.tags ?? [],
    aliases: r.aliases ?? [],
    refTable: r.ref_table,
    refId: r.ref_id,
    isPublished: r.is_published,
    updatedAt: r.updated_at,
  };
}

const SELECT_COLS = `id, slug, title, kind, body_md, tags, aliases,
  ref_table, ref_id, is_published, updated_at::text`;

export async function getBySlug(slug: string): Promise<WikiPage | null> {
  const r = await queryOne<Row>(
    `SELECT ${SELECT_COLS} FROM sena_ev.wiki_pages WHERE slug = $1`,
    [slug],
  );
  return r ? toPage(r) : null;
}

export async function getById(id: string): Promise<WikiPage | null> {
  const r = await queryOne<Row>(
    `SELECT ${SELECT_COLS} FROM sena_ev.wiki_pages WHERE id = $1`,
    [id],
  );
  return r ? toPage(r) : null;
}

export async function getByRef(
  refTable: string,
  refId: string,
): Promise<WikiPage | null> {
  const r = await queryOne<Row>(
    `SELECT ${SELECT_COLS}
       FROM sena_ev.wiki_pages
      WHERE ref_table = $1 AND ref_id = $2
      LIMIT 1`,
    [refTable, refId],
  );
  return r ? toPage(r) : null;
}

export async function listByKind(kind: WikiKind): Promise<WikiPage[]> {
  const r = await query<Row>(
    `SELECT ${SELECT_COLS}
       FROM sena_ev.wiki_pages
      WHERE kind = $1 AND is_published = true
      ORDER BY title ASC`,
    [kind],
  );
  return r.rows.map(toPage);
}

export async function resolveByAlias(alias: string): Promise<WikiPage | null> {
  const r = await queryOne<Row>(
    `SELECT ${SELECT_COLS}
       FROM sena_ev.wiki_pages
      WHERE $1 = ANY(aliases) OR slug = $1 OR title = $1
      ORDER BY (CASE WHEN slug = $1 THEN 0 WHEN title = $1 THEN 1 ELSE 2 END)
      LIMIT 1`,
    [alias],
  );
  return r ? toPage(r) : null;
}

export type WikiInput = {
  slug: string;
  title: string;
  kind: WikiKind;
  bodyMd: string;
  tags?: string[];
  aliases?: string[];
  refTable?: string | null;
  refId?: string | null;
  isPublished?: boolean;
};

export async function upsert(input: WikiInput): Promise<WikiPage> {
  const r = await queryOne<Row>(
    `INSERT INTO sena_ev.wiki_pages
       (slug, title, kind, body_md, tags, aliases, ref_table, ref_id, is_published)
     VALUES ($1, $2, $3, $4, COALESCE($5, '{}'::text[]), COALESCE($6, '{}'::text[]), $7, $8, COALESCE($9, true))
     ON CONFLICT (slug) DO UPDATE SET
       title        = EXCLUDED.title,
       kind         = EXCLUDED.kind,
       body_md      = EXCLUDED.body_md,
       tags         = EXCLUDED.tags,
       aliases      = EXCLUDED.aliases,
       ref_table    = EXCLUDED.ref_table,
       ref_id       = EXCLUDED.ref_id,
       is_published = EXCLUDED.is_published
     RETURNING ${SELECT_COLS}`,
    [
      input.slug,
      input.title,
      input.kind,
      input.bodyMd,
      input.tags ?? null,
      input.aliases ?? null,
      input.refTable ?? null,
      input.refId ?? null,
      input.isPublished ?? null,
    ],
  );
  if (!r) throw new Error("wiki upsert failed");
  return toPage(r);
}

export async function remove(slug: string): Promise<void> {
  await query(`DELETE FROM sena_ev.wiki_pages WHERE slug = $1`, [slug]);
}
