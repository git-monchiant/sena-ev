import "server-only";
import { query } from "./db";

export type CompanyBrand = {
  nameTh: string;
  nameEn: string;
  tagline: string;
};

export type CompanyContact = {
  phone: string | null;
  website: string | null;
  email: string | null;
};

type Row<T> = { value: T };

async function get<T>(key: string): Promise<T | null> {
  const r = await query<Row<T>>(
    `SELECT value FROM sena_ev.company_settings WHERE key = $1 LIMIT 1`,
    [key],
  );
  return r.rows[0]?.value ?? null;
}

export async function getBrand(): Promise<CompanyBrand | null> {
  type R = { name_th: string; name_en: string; tagline: string };
  const v = await get<R>("brand");
  if (!v) return null;
  return { nameTh: v.name_th, nameEn: v.name_en, tagline: v.tagline };
}

export async function getContact(): Promise<CompanyContact | null> {
  return get<CompanyContact>("contact");
}
