import "server-only";
import { query } from "../../db";

type Row = {
  slug: string;
  title: string;
  kind: string;
  body_md: string;
};

/**
 * Render the published shared wiki as a single markdown block.
 *
 * Compact enough to fit in the always-on context (~1.5–2k tokens for
 * the current corpus of 12 cars + 3 showrooms + 2 promos).
 *
 * Grouped by kind so the model can scan the right section.
 */
export async function renderSharedWikiBlock(): Promise<string> {
  const r = await query<Row>(
    `SELECT slug, title, kind, body_md
       FROM sena_ev.wiki_pages
      WHERE is_published = true
      ORDER BY kind ASC, title ASC`,
  );
  if (r.rows.length === 0) return "(ยังไม่มีข้อมูล wiki)";

  const groups = new Map<string, Row[]>();
  for (const row of r.rows) {
    const arr = groups.get(row.kind) ?? [];
    arr.push(row);
    groups.set(row.kind, arr);
  }

  const sections: string[] = [];
  const order: string[] = ["brand", "product", "faq", "policy", "process", "note"];
  const sortedKinds = [...groups.keys()].sort((a, b) => {
    const ai = order.indexOf(a);
    const bi = order.indexOf(b);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  for (const kind of sortedKinds) {
    const rows = groups.get(kind)!;
    for (const row of rows) {
      sections.push(`### ${row.title}  \`(${kind} · ${row.slug})\``);
      sections.push(row.body_md.trim());
      sections.push("");
    }
  }

  return sections.join("\n");
}
