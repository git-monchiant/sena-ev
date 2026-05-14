import "server-only";
import { query } from "./db";

export type Promotion = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  type: string;
  badge: string | null;
  payload: Record<string, unknown>;
  bankName: string | null;
  validFrom: string | null;
  validTo: string | null;
  applicableModelIds: string[];
  sortOrder: number;
};

type Row = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  type: string;
  badge: string | null;
  payload: Record<string, unknown>;
  bank_name: string | null;
  valid_from: string | null;
  valid_to: string | null;
  applicable_model_ids: string[] | null;
  sort_order: number;
};

function toPromotion(r: Row): Promotion {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    description: r.description,
    type: r.type,
    badge: r.badge,
    payload: r.payload ?? {},
    bankName: r.bank_name,
    validFrom: r.valid_from,
    validTo: r.valid_to,
    applicableModelIds: r.applicable_model_ids ?? [],
    sortOrder: r.sort_order,
  };
}

export async function getActivePromotions(): Promise<Promotion[]> {
  const r = await query<Row>(
    `SELECT id, slug, title, description, type, badge, payload,
            bank_name, valid_from, valid_to, applicable_model_ids,
            sort_order
       FROM sena_ev.promotions
      WHERE is_active = true
        AND (valid_from IS NULL OR valid_from <= now())
        AND (valid_to   IS NULL OR valid_to   >= now())
      ORDER BY sort_order ASC, title ASC`,
  );
  return r.rows.map(toPromotion);
}

/* ───────────── admin CRUD ───────────── */

export type AdminPromotion = Promotion & { isActive: boolean };

type AdminRow = Row & { is_active: boolean };

function toAdminPromotion(r: AdminRow): AdminPromotion {
  return { ...toPromotion(r), isActive: r.is_active };
}

const SELECT_ADMIN_COLS = `id, slug, title, description, type, badge, payload,
  bank_name, valid_from::text, valid_to::text, applicable_model_ids,
  sort_order, is_active`;

export async function listAllPromotions(): Promise<AdminPromotion[]> {
  const r = await query<AdminRow>(
    `SELECT ${SELECT_ADMIN_COLS}
       FROM sena_ev.promotions
      ORDER BY sort_order ASC, title ASC`,
  );
  return r.rows.map(toAdminPromotion);
}

export async function getPromotionById(
  id: string,
): Promise<AdminPromotion | null> {
  const r = await query<AdminRow>(
    `SELECT ${SELECT_ADMIN_COLS}
       FROM sena_ev.promotions WHERE id = $1 LIMIT 1`,
    [id],
  );
  return r.rows[0] ? toAdminPromotion(r.rows[0]) : null;
}

export type PromotionInput = {
  slug: string;
  title: string;
  description: string | null;
  type: string;
  badge: string | null;
  payload: Record<string, unknown>;
  bankName: string | null;
  validFrom: string | null;
  validTo: string | null;
  applicableModelIds: string[];
  sortOrder: number;
  isActive: boolean;
};

export async function createPromotion(input: PromotionInput): Promise<string> {
  const r = await query<{ id: string }>(
    `INSERT INTO sena_ev.promotions
       (slug, title, description, type, badge, payload,
        bank_name, valid_from, valid_to, applicable_model_ids,
        sort_order, is_active, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,$8,$9,$10,$11,$12,now(),now())
     RETURNING id`,
    [
      input.slug,
      input.title,
      input.description,
      input.type,
      input.badge,
      JSON.stringify(input.payload ?? {}),
      input.bankName,
      input.validFrom,
      input.validTo,
      input.applicableModelIds,
      input.sortOrder,
      input.isActive,
    ],
  );
  return r.rows[0]!.id;
}

export async function updatePromotion(
  id: string,
  input: PromotionInput,
): Promise<void> {
  await query(
    `UPDATE sena_ev.promotions SET
       slug=$2, title=$3, description=$4, type=$5, badge=$6,
       payload=$7::jsonb, bank_name=$8, valid_from=$9, valid_to=$10,
       applicable_model_ids=$11, sort_order=$12, is_active=$13,
       updated_at=now()
     WHERE id=$1`,
    [
      id,
      input.slug,
      input.title,
      input.description,
      input.type,
      input.badge,
      JSON.stringify(input.payload ?? {}),
      input.bankName,
      input.validFrom,
      input.validTo,
      input.applicableModelIds,
      input.sortOrder,
      input.isActive,
    ],
  );
}

export async function deletePromotion(id: string): Promise<void> {
  await query(`DELETE FROM sena_ev.promotions WHERE id = $1`, [id]);
}
