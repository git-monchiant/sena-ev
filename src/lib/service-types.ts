import "server-only";
import { query } from "./db";

export type ServiceType = {
  id: string;
  slug: string;
  nameTh: string;
  nameEn: string | null;
  defaultDurationMinutes: number;
  sortOrder: number;
};

type Row = {
  id: string;
  slug: string;
  name_th: string;
  name_en: string | null;
  default_duration_minutes: number;
  sort_order: number;
};

export async function getActiveServiceTypes(): Promise<ServiceType[]> {
  const r = await query<Row>(
    `SELECT id, slug, name_th, name_en, default_duration_minutes, sort_order
       FROM sena_ev.service_types
      WHERE is_active = true
      ORDER BY sort_order ASC, name_th ASC`,
  );
  return r.rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    nameTh: r.name_th,
    nameEn: r.name_en,
    defaultDurationMinutes: r.default_duration_minutes,
    sortOrder: r.sort_order,
  }));
}
