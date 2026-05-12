import "server-only";
import { query } from "../db";
import { syncAllSharedWiki } from "./wiki/sync";

/**
 * Generate / refresh shared wiki pages from structured tables.
 *
 * Thin wrapper around `syncAllSharedWiki()` (in ./wiki/sync) kept for
 * backwards compatibility with /api/admin/bot/seed.
 *
 * Pages produced:
 *   car-<slug>         (one per car_model)
 *   showroom-<slug>    (one per showroom)
 *   promo-<slug>       (one per promotion)
 *
 * Inactive source rows mark their wiki page is_published=false rather
 * than deleting (preserves history + edges).
 */
export async function seedSharedWiki(): Promise<{
  cars: number;
  showrooms: number;
  promos: number;
}> {
  return syncAllSharedWiki();
}

/** Quick CLI-style helper: count of wiki pages by kind. */
export async function wikiSummary(): Promise<Record<string, number>> {
  const r = await query<{ kind: string; n: number }>(
    `SELECT kind, COUNT(*)::int AS n
       FROM sena_ev.wiki_pages
      GROUP BY kind
      ORDER BY kind`,
  );
  const map: Record<string, number> = {};
  for (const row of r.rows) map[row.kind] = row.n;
  return map;
}
