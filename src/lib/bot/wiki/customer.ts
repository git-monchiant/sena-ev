import "server-only";
import { query, queryOne } from "../../db";
import type { CustomerWikiKind, CustomerWikiPage } from "../types";

type Row = {
  id: string;
  customer_id: string;
  slug: string;
  title: string;
  kind: CustomerWikiKind;
  body_md: string;
  aliases: string[] | null;
  importance: number;
  source: string | null;
  source_message_id: string | null;
  updated_at: string;
};

function toPage(r: Row): CustomerWikiPage {
  return {
    id: r.id,
    customerId: r.customer_id,
    slug: r.slug,
    title: r.title,
    kind: r.kind,
    bodyMd: r.body_md,
    aliases: r.aliases ?? [],
    importance: r.importance,
    source: r.source,
    sourceMessageId: r.source_message_id,
    updatedAt: r.updated_at,
  };
}

const SELECT_COLS = `id, customer_id, slug, title, kind, body_md, aliases,
  importance, source, source_message_id, updated_at::text`;

export async function listByCustomer(
  customerId: string,
  opts: { minImportance?: number } = {},
): Promise<CustomerWikiPage[]> {
  const min = opts.minImportance ?? 3;
  const r = await query<Row>(
    `SELECT ${SELECT_COLS}
       FROM sena_ev.customer_wiki_pages
      WHERE customer_id = $1 AND importance <= $2
      ORDER BY importance ASC, updated_at DESC`,
    [customerId, min],
  );
  return r.rows.map(toPage);
}

export async function getByCustomerAndSlug(
  customerId: string,
  slug: string,
): Promise<CustomerWikiPage | null> {
  const r = await queryOne<Row>(
    `SELECT ${SELECT_COLS}
       FROM sena_ev.customer_wiki_pages
      WHERE customer_id = $1 AND slug = $2`,
    [customerId, slug],
  );
  return r ? toPage(r) : null;
}

export type CustomerWikiInput = {
  customerId: string;
  slug: string;
  title: string;
  kind: CustomerWikiKind;
  bodyMd: string;
  aliases?: string[];
  importance?: number;
  source?: string;
  sourceMessageId?: string | null;
};

export async function upsert(
  input: CustomerWikiInput,
): Promise<CustomerWikiPage> {
  const r = await queryOne<Row>(
    `INSERT INTO sena_ev.customer_wiki_pages
       (customer_id, slug, title, kind, body_md, aliases, importance, source, source_message_id)
     VALUES ($1, $2, $3, $4, $5, COALESCE($6, '{}'::text[]), COALESCE($7, 2), $8, $9)
     ON CONFLICT (customer_id, slug) DO UPDATE SET
       title             = EXCLUDED.title,
       kind              = EXCLUDED.kind,
       body_md           = EXCLUDED.body_md,
       aliases           = EXCLUDED.aliases,
       importance        = EXCLUDED.importance,
       source            = EXCLUDED.source,
       source_message_id = EXCLUDED.source_message_id
     RETURNING ${SELECT_COLS}`,
    [
      input.customerId,
      input.slug,
      input.title,
      input.kind,
      input.bodyMd,
      input.aliases ?? null,
      input.importance ?? null,
      input.source ?? null,
      input.sourceMessageId ?? null,
    ],
  );
  if (!r) throw new Error("customer wiki upsert failed");
  return toPage(r);
}

export async function remove(
  customerId: string,
  slug: string,
): Promise<void> {
  await query(
    `DELETE FROM sena_ev.customer_wiki_pages WHERE customer_id = $1 AND slug = $2`,
    [customerId, slug],
  );
}
