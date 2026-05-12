import "server-only";
import { query } from "../../db";

type Row = {
  slug: string;
  title: string;
  kind: string;
  body_md: string;
  rank: number;
};

/**
 * Naive substring search over published wiki pages. v1 — no full text
 * index, no embeddings. Good enough for ~100 pages.
 */
export async function searchWiki(
  q: string,
  limit = 5,
): Promise<unknown> {
  const pattern = `%${q.toLowerCase()}%`;
  const r = await query<Row>(
    `SELECT slug, title, kind, body_md,
            (CASE WHEN LOWER(title) LIKE $1 THEN 2 ELSE 0 END
             + CASE WHEN LOWER(body_md) LIKE $1 THEN 1 ELSE 0 END
             + CASE WHEN $2 = ANY(aliases) THEN 2 ELSE 0 END
             + CASE WHEN $2 = ANY(tags) THEN 1 ELSE 0 END)::int AS rank
       FROM sena_ev.wiki_pages
      WHERE is_published = true
        AND (LOWER(title) LIKE $1
             OR LOWER(body_md) LIKE $1
             OR $2 = ANY(aliases)
             OR $2 = ANY(tags))
      ORDER BY rank DESC, title ASC
      LIMIT $3`,
    [pattern, q, limit],
  );
  return r.rows.map((row) => ({
    slug: row.slug,
    title: row.title,
    kind: row.kind,
    snippet: row.body_md.slice(0, 240),
  }));
}
