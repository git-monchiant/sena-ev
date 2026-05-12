import "server-only";
import { query } from "./db";

export type CarModel = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  bodyType: string | null;
  priceBaht: number | null;
  rangeKm: number | null;
  motorHp: number | null;
  batteryKwh: number | null;
  zeroToHundredS: number | null;
  topSpeedKmh: number | null;
  chargingDcKw: number | null;
  brochureUrl: string | null;
  colors: string[];
  images: string[];
};

type Row = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  body_type: string | null;
  price_baht: string | null;
  range_km: string | null;
  motor_hp: string | null;
  battery_kwh: string | null;
  zero_to_hundred_s: string | null;
  top_speed_kmh: string | null;
  charging_dc_kw: string | null;
  brochure_url: string | null;
  colors: string[] | null;
  images: string[] | null;
};

function num(v: string | null): number | null {
  return v == null ? null : Number(v);
}

function toModel(r: Row): CarModel {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    brand: r.brand,
    bodyType: r.body_type,
    priceBaht: num(r.price_baht),
    rangeKm: num(r.range_km),
    motorHp: num(r.motor_hp),
    batteryKwh: num(r.battery_kwh),
    zeroToHundredS: num(r.zero_to_hundred_s),
    topSpeedKmh: num(r.top_speed_kmh),
    chargingDcKw: num(r.charging_dc_kw),
    brochureUrl: r.brochure_url,
    colors: r.colors ?? [],
    images: r.images ?? [],
  };
}

const SELECT_COLS = `
  id, slug, name, brand, body_type, price_baht,
  NULLIF(spec->>'range_km','')::numeric          AS range_km,
  NULLIF(spec->>'motor_hp','')::numeric          AS motor_hp,
  NULLIF(spec->>'battery_kwh','')::numeric       AS battery_kwh,
  NULLIF(spec->>'zero_to_hundred_s','')::numeric AS zero_to_hundred_s,
  NULLIF(spec->>'top_speed_kmh','')::numeric     AS top_speed_kmh,
  NULLIF(spec->>'charging_dc_kw','')::numeric    AS charging_dc_kw,
  brochure_url, colors, images
`;

export async function getActiveCarModels(): Promise<CarModel[]> {
  const r = await query<Row>(
    `SELECT ${SELECT_COLS}
       FROM sena_ev.car_models
      WHERE is_active = true
      ORDER BY sort_order ASC, name ASC`,
  );
  return r.rows.map(toModel);
}

export async function getCarModelBySlug(slug: string): Promise<CarModel | null> {
  const r = await query<Row>(
    `SELECT ${SELECT_COLS}
       FROM sena_ev.car_models
      WHERE slug = $1
      LIMIT 1`,
    [slug],
  );
  return r.rows[0] ? toModel(r.rows[0]) : null;
}

export type AdminCarModel = CarModel & {
  sortOrder: number;
  isActive: boolean;
};

type AdminRow = Row & { sort_order: number; is_active: boolean };

export async function listAllCarModels(): Promise<AdminCarModel[]> {
  const r = await query<AdminRow>(
    `SELECT ${SELECT_COLS}, sort_order, is_active
       FROM sena_ev.car_models
      ORDER BY sort_order ASC, name ASC`,
  );
  return r.rows.map((row) => ({
    ...toModel(row),
    sortOrder: row.sort_order,
    isActive: row.is_active,
  }));
}

export async function getCarModelById(id: string): Promise<AdminCarModel | null> {
  const r = await query<AdminRow>(
    `SELECT ${SELECT_COLS}, sort_order, is_active
       FROM sena_ev.car_models
      WHERE id = $1
      LIMIT 1`,
    [id],
  );
  const row = r.rows[0];
  if (!row) return null;
  return { ...toModel(row), sortOrder: row.sort_order, isActive: row.is_active };
}

export type CarModelInput = {
  slug: string;
  name: string;
  brand: string;
  bodyType: string | null;
  priceBaht: number | null;
  rangeKm: number | null;
  brochureUrl: string | null;
  colors: string[];
  images: string[];
  sortOrder: number;
  isActive: boolean;
};

export async function createCarModel(input: CarModelInput): Promise<string> {
  const r = await query<{ id: string }>(
    `INSERT INTO sena_ev.car_models
       (slug, name, brand, body_type, price_baht, spec, brochure_url, colors, images, sort_order, is_active, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,$8,$9,$10,$11,now(),now())
     RETURNING id`,
    [
      input.slug,
      input.name,
      input.brand,
      input.bodyType,
      input.priceBaht,
      JSON.stringify(input.rangeKm != null ? { range_km: input.rangeKm } : {}),
      input.brochureUrl,
      input.colors,
      input.images,
      input.sortOrder,
      input.isActive,
    ],
  );
  return r.rows[0]!.id;
}

export async function updateCarModel(
  id: string,
  input: CarModelInput,
): Promise<void> {
  await query(
    `UPDATE sena_ev.car_models SET
       slug=$2, name=$3, brand=$4, body_type=$5, price_baht=$6,
       spec = COALESCE(spec, '{}'::jsonb) ||
              CASE WHEN $7::numeric IS NULL
                   THEN jsonb_build_object('range_km', NULL)
                   ELSE jsonb_build_object('range_km', $7::numeric)
              END,
       brochure_url=$8, colors=$9, images=$10, sort_order=$11, is_active=$12,
       updated_at=now()
     WHERE id=$1`,
    [
      id,
      input.slug,
      input.name,
      input.brand,
      input.bodyType,
      input.priceBaht,
      input.rangeKm,
      input.brochureUrl,
      input.colors,
      input.images,
      input.sortOrder,
      input.isActive,
    ],
  );
}

export async function deleteCarModel(id: string): Promise<void> {
  await query(`DELETE FROM sena_ev.car_models WHERE id = $1`, [id]);
}
