import "server-only";
import { query, queryOne } from "./db";

export type TagCategory = "intent" | "model" | "service" | "other";

export type Tag = {
  id: string;
  name: string;
  category: TagCategory;
  color: string;
  description: string | null;
  is_active: boolean;
  sort_order: number;
};

export type CustomerTag = Tag & {
  tagged_at: Date;
  note: string | null;
};

export async function listAllTags(): Promise<Tag[]> {
  const result = await query<Tag>(
    `SELECT id, name, category, color, description, is_active, sort_order
     FROM sena_ev.tags
     WHERE is_active
     ORDER BY sort_order, name`,
  );
  return result.rows;
}

export async function listCustomerTags(customerId: string): Promise<CustomerTag[]> {
  const result = await query<CustomerTag>(
    `SELECT t.id, t.name, t.category, t.color, t.description,
            t.is_active, t.sort_order, ct.tagged_at, ct.note
     FROM sena_ev.customer_tags ct
     JOIN sena_ev.tags t ON t.id = ct.tag_id
     WHERE ct.customer_id = $1
     ORDER BY t.sort_order, t.name`,
    [customerId],
  );
  return result.rows;
}

export async function addCustomerTag(params: {
  customerId: string;
  tagId: string;
  note?: string;
  taggedBy?: string;
}): Promise<void> {
  await query(
    `INSERT INTO sena_ev.customer_tags (customer_id, tag_id, note, tagged_by)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (customer_id, tag_id) DO UPDATE SET
       note = EXCLUDED.note,
       tagged_at = now()`,
    [params.customerId, params.tagId, params.note ?? null, params.taggedBy ?? null],
  );
}

export async function removeCustomerTag(
  customerId: string,
  tagId: string,
): Promise<void> {
  await query(
    `DELETE FROM sena_ev.customer_tags WHERE customer_id = $1 AND tag_id = $2`,
    [customerId, tagId],
  );
}

export async function createTag(params: {
  name: string;
  category: TagCategory;
  color?: string;
  description?: string;
}): Promise<Tag> {
  const row = await queryOne<Tag>(
    `INSERT INTO sena_ev.tags (name, category, color, description)
     VALUES ($1, $2, COALESCE($3, '#6b7280'), $4)
     RETURNING id, name, category, color, description, is_active, sort_order`,
    [params.name, params.category, params.color ?? null, params.description ?? null],
  );
  if (!row) throw new Error("createTag: insert returned no row");
  return row;
}

export async function deactivateTag(id: string): Promise<void> {
  await query(
    `UPDATE sena_ev.tags SET is_active = false WHERE id = $1`,
    [id],
  );
}
