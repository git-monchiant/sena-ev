import "server-only";
import { query } from "./db";

export type EmergencyContact = {
  id: string;
  slug: string;
  labelTh: string;
  phone: string;
  description: string | null;
  isPrimary: boolean;
  sortOrder: number;
};

type Row = {
  id: string;
  slug: string;
  label_th: string;
  phone: string;
  description: string | null;
  is_primary: boolean;
  sort_order: number;
};

export async function getActiveEmergencyContacts(): Promise<
  EmergencyContact[]
> {
  const r = await query<Row>(
    `SELECT id, slug, label_th, phone, description, is_primary, sort_order
       FROM sena_ev.emergency_contacts
      WHERE is_active = true
      ORDER BY is_primary DESC, sort_order ASC`,
  );
  return r.rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    labelTh: r.label_th,
    phone: r.phone,
    description: r.description,
    isPrimary: r.is_primary,
    sortOrder: r.sort_order,
  }));
}
