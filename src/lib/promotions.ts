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
