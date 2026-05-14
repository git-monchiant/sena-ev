import "server-only";
import { query } from "./db";

export type Showroom = {
  id: string;
  slug: string;
  name: string;
  shortName: string | null;
  address: string;
  district: string | null;
  province: string | null;
  phone: string | null;
  lat: number | null;
  lng: number | null;
  gmapUrl: string | null;
  opensAt: string | null;
  closesAt: string | null;
  daysOpen: number[];
  services: string[];
  sortOrder: number;
  isActive: boolean;
};

type Row = {
  id: string;
  slug: string;
  name: string;
  short_name: string | null;
  address: string;
  district: string | null;
  province: string | null;
  phone: string | null;
  lat: string | null;
  lng: string | null;
  gmap_url: string | null;
  opens_at: string | null;
  closes_at: string | null;
  days_open: number[] | null;
  services: string[] | null;
  sort_order: number;
  is_active: boolean;
};

function toShowroom(r: Row): Showroom {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    shortName: r.short_name,
    address: r.address,
    district: r.district,
    province: r.province,
    phone: r.phone,
    lat: r.lat == null ? null : Number(r.lat),
    lng: r.lng == null ? null : Number(r.lng),
    gmapUrl: r.gmap_url,
    opensAt: r.opens_at,
    closesAt: r.closes_at,
    daysOpen: r.days_open ?? [],
    services: r.services ?? [],
    sortOrder: r.sort_order,
    isActive: r.is_active,
  };
}

const SELECT_COLS = `id, slug, name, short_name, address, district, province,
  phone, lat, lng, gmap_url, opens_at::text, closes_at::text,
  days_open, services, sort_order, is_active`;

export async function getActiveShowrooms(): Promise<Showroom[]> {
  const r = await query<Row>(
    `SELECT ${SELECT_COLS}
       FROM sena_ev.showrooms
      WHERE is_active = true
      ORDER BY sort_order ASC, name ASC`,
  );
  return r.rows.map(toShowroom);
}

export async function getShowroomBySlug(
  slug: string,
): Promise<Showroom | null> {
  const r = await query<Row>(
    `SELECT ${SELECT_COLS}
       FROM sena_ev.showrooms
      WHERE slug = $1
      LIMIT 1`,
    [slug],
  );
  return r.rows[0] ? toShowroom(r.rows[0]) : null;
}

/* ───────────── admin CRUD ───────────── */

export async function listAllShowrooms(): Promise<Showroom[]> {
  const r = await query<Row>(
    `SELECT ${SELECT_COLS}
       FROM sena_ev.showrooms
      ORDER BY sort_order ASC, name ASC`,
  );
  return r.rows.map(toShowroom);
}

export async function getShowroomById(id: string): Promise<Showroom | null> {
  const r = await query<Row>(
    `SELECT ${SELECT_COLS} FROM sena_ev.showrooms WHERE id = $1 LIMIT 1`,
    [id],
  );
  return r.rows[0] ? toShowroom(r.rows[0]) : null;
}

export type ShowroomInput = {
  slug: string;
  name: string;
  shortName: string | null;
  address: string;
  district: string | null;
  province: string | null;
  phone: string | null;
  lat: number | null;
  lng: number | null;
  gmapUrl: string | null;
  opensAt: string | null;
  closesAt: string | null;
  daysOpen: number[];
  services: string[];
  sortOrder: number;
  isActive: boolean;
};

export async function createShowroom(input: ShowroomInput): Promise<string> {
  const r = await query<{ id: string }>(
    `INSERT INTO sena_ev.showrooms
       (slug, name, short_name, address, district, province, phone,
        lat, lng, gmap_url, opens_at, closes_at,
        days_open, services, sort_order, is_active,
        created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,now(),now())
     RETURNING id`,
    [
      input.slug,
      input.name,
      input.shortName,
      input.address,
      input.district,
      input.province,
      input.phone,
      input.lat,
      input.lng,
      input.gmapUrl,
      input.opensAt,
      input.closesAt,
      input.daysOpen,
      input.services,
      input.sortOrder,
      input.isActive,
    ],
  );
  return r.rows[0]!.id;
}

export async function updateShowroom(
  id: string,
  input: ShowroomInput,
): Promise<void> {
  await query(
    `UPDATE sena_ev.showrooms SET
       slug=$2, name=$3, short_name=$4, address=$5, district=$6,
       province=$7, phone=$8, lat=$9, lng=$10, gmap_url=$11,
       opens_at=$12, closes_at=$13, days_open=$14, services=$15,
       sort_order=$16, is_active=$17, updated_at=now()
     WHERE id=$1`,
    [
      id,
      input.slug,
      input.name,
      input.shortName,
      input.address,
      input.district,
      input.province,
      input.phone,
      input.lat,
      input.lng,
      input.gmapUrl,
      input.opensAt,
      input.closesAt,
      input.daysOpen,
      input.services,
      input.sortOrder,
      input.isActive,
    ],
  );
}

export async function deleteShowroom(id: string): Promise<void> {
  await query(`DELETE FROM sena_ev.showrooms WHERE id = $1`, [id]);
}
