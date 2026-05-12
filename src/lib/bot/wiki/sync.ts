import "server-only";
import { query, queryOne } from "../../db";
import { upsert as upsertEdge } from "./edges";
import { getByRef, upsert as upsertWiki } from "./shared";

/**
 * Auto-sync shared wiki pages from structured source-of-truth tables
 * (car_models / showrooms / promotions).
 *
 * Why: admin can edit a car's price/spec in /admin/cars but the bot
 * reads from wiki_pages.body_md. Without sync those two diverge — and
 * the bot starts quoting stale prices. These helpers are invoked from
 * the admin server actions right after every CRUD mutation, and exposed
 * via a "Re-sync now" trigger for cases where rows changed via SQL.
 *
 * Behaviour:
 *   - source row active   → upsert wiki_pages, mark is_published=true
 *   - source row inactive → mark wiki_pages.is_published=false (keep
 *                           history + edges intact)
 *   - source row missing  → mark wiki_pages.is_published=false if a
 *                           wiki row exists for that ref; otherwise noop
 */

export type SyncOutcome =
  | { action: "upserted"; slug: string }
  | { action: "unpublished"; slug: string }
  | { action: "skipped"; reason: string };

/* ─────────────── cars ─────────────── */

type CarRow = {
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
  is_active: boolean;
};

const CAR_SELECT = `id, slug, name, brand, body_type, price_baht,
  NULLIF(spec->>'range_km','')::numeric          AS range_km,
  NULLIF(spec->>'motor_hp','')::numeric          AS motor_hp,
  NULLIF(spec->>'battery_kwh','')::numeric       AS battery_kwh,
  NULLIF(spec->>'zero_to_hundred_s','')::numeric AS zero_to_hundred_s,
  NULLIF(spec->>'top_speed_kmh','')::numeric     AS top_speed_kmh,
  NULLIF(spec->>'charging_dc_kw','')::numeric    AS charging_dc_kw,
  brochure_url, is_active`;

function renderCarBody(c: CarRow): string {
  const branded = c.name.toUpperCase().startsWith(c.brand.toUpperCase())
    ? c.name
    : `${c.brand} ${c.name}`;
  const num = (v: string | null) => (v == null ? null : Number(v));

  const specs: string[] = [];
  if (c.price_baht)
    specs.push(`- ราคาเริ่มต้น: ${Number(c.price_baht).toLocaleString()} บาท`);
  const range = num(c.range_km);
  if (range != null) specs.push(`- ระยะวิ่ง: ${range} km`);
  const bat = num(c.battery_kwh);
  if (bat != null) specs.push(`- แบตเตอรี่: ${bat} kWh`);
  const motor = num(c.motor_hp);
  if (motor != null) specs.push(`- มอเตอร์: ${motor} hp`);
  const zth = num(c.zero_to_hundred_s);
  if (zth != null) specs.push(`- 0–100 km/h: ${zth} วินาที`);
  const top = num(c.top_speed_kmh);
  if (top != null) specs.push(`- ความเร็วสูงสุด: ${top} km/h`);
  const dc = num(c.charging_dc_kw);
  if (dc != null) specs.push(`- ชาร์จเร็ว DC: ${dc} kW`);

  return [
    `${branded}${c.body_type ? ` · ${c.body_type}` : ""}`,
    "",
    specs.join("\n"),
    c.brochure_url ? `\nBrochure: ${c.brochure_url}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export async function syncCarWikiPage(carId: string): Promise<SyncOutcome> {
  const c = await queryOne<CarRow>(
    `SELECT ${CAR_SELECT} FROM sena_ev.car_models WHERE id = $1`,
    [carId],
  );
  if (!c) {
    const existing = await getByRef("car_models", carId);
    if (!existing) return { action: "skipped", reason: "no_source_no_wiki" };
    await query(
      `UPDATE sena_ev.wiki_pages SET is_published = false WHERE id = $1`,
      [existing.id],
    );
    return { action: "unpublished", slug: existing.slug };
  }
  const branded = c.name.toUpperCase().startsWith(c.brand.toUpperCase())
    ? c.name
    : `${c.brand} ${c.name}`;
  const slug = `car-${c.slug}`;
  await upsertWiki({
    slug,
    title: branded,
    kind: "product",
    bodyMd: renderCarBody(c),
    tags: ["car", c.brand.toLowerCase(), c.body_type ?? ""].filter(Boolean),
    aliases: [c.name, branded, c.slug, c.brand].filter(
      (v, i, a) => v && a.indexOf(v) === i,
    ),
    refTable: "car_models",
    refId: c.id,
    isPublished: c.is_active,
  });
  return { action: c.is_active ? "upserted" : "unpublished", slug };
}

/* ─────────────── showrooms ─────────────── */

type ShowroomRow = {
  id: string;
  slug: string;
  name: string;
  short_name: string | null;
  address: string;
  district: string | null;
  province: string | null;
  phone: string | null;
  opens_at: string | null;
  closes_at: string | null;
  services: string[] | null;
  gmap_url: string | null;
  is_active: boolean;
};

function renderShowroomBody(s: ShowroomRow): string {
  const hours =
    s.opens_at && s.closes_at
      ? `${s.opens_at.slice(0, 5)}–${s.closes_at.slice(0, 5)}`
      : "—";
  const services = s.services && s.services.length > 0
    ? s.services.join(", ")
    : "—";
  return [
    s.name,
    "",
    `- ที่อยู่: ${s.address}`,
    `- เปิด: ${hours}`,
    s.phone ? `- โทร: ${s.phone}` : "",
    `- บริการ: ${services}`,
    s.gmap_url ? `\nแผนที่: ${s.gmap_url}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export async function syncShowroomWikiPage(
  showroomId: string,
): Promise<SyncOutcome> {
  const s = await queryOne<ShowroomRow>(
    `SELECT id, slug, name, short_name, address, district, province,
            phone, opens_at::text, closes_at::text, services,
            gmap_url, is_active
       FROM sena_ev.showrooms WHERE id = $1`,
    [showroomId],
  );
  if (!s) {
    const existing = await getByRef("showrooms", showroomId);
    if (!existing) return { action: "skipped", reason: "no_source_no_wiki" };
    await query(
      `UPDATE sena_ev.wiki_pages SET is_published = false WHERE id = $1`,
      [existing.id],
    );
    return { action: "unpublished", slug: existing.slug };
  }
  const slug = `showroom-${s.slug}`;
  await upsertWiki({
    slug,
    title: s.name,
    kind: "product",
    bodyMd: renderShowroomBody(s),
    tags: ["showroom", s.province ?? "", s.district ?? ""].filter(Boolean),
    aliases: [s.short_name ?? "", s.name].filter(Boolean),
    refTable: "showrooms",
    refId: s.id,
    isPublished: s.is_active,
  });
  return { action: s.is_active ? "upserted" : "unpublished", slug };
}

/* ─────────────── promotions ─────────────── */

type PromoRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  type: string;
  bank_name: string | null;
  payload: Record<string, unknown>;
  valid_to: string | null;
  applicable_model_ids: string[] | null;
  is_active: boolean;
};

function renderPromoBody(p: PromoRow): string {
  const payload = p.payload ?? {};
  const detail: string[] = [];
  if (typeof payload.rate === "number")
    detail.push(`- อัตรา: ${payload.rate}%`);
  if (typeof payload.months === "number")
    detail.push(`- ระยะเวลา: ${payload.months} เดือน`);
  if (p.bank_name) detail.push(`- ธนาคาร: ${p.bank_name}`);
  if (typeof payload.max_value_baht === "number")
    detail.push(
      `- มูลค่าสูงสุด: ${(payload.max_value_baht as number).toLocaleString()} บาท`,
    );
  return [
    p.title,
    p.description ?? "",
    "",
    detail.join("\n"),
    p.valid_to ? `\nมีผลถึง ${p.valid_to.slice(0, 10)}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export async function syncPromoWikiPage(
  promoId: string,
): Promise<SyncOutcome> {
  const p = await queryOne<PromoRow>(
    `SELECT id, slug, title, description, type, bank_name, payload,
            valid_to::text, applicable_model_ids, is_active
       FROM sena_ev.promotions WHERE id = $1`,
    [promoId],
  );
  if (!p) {
    const existing = await getByRef("promotions", promoId);
    if (!existing) return { action: "skipped", reason: "no_source_no_wiki" };
    await query(
      `UPDATE sena_ev.wiki_pages SET is_published = false WHERE id = $1`,
      [existing.id],
    );
    return { action: "unpublished", slug: existing.slug };
  }
  const slug = `promo-${p.slug}`;
  const wikiPage = await upsertWiki({
    slug,
    title: p.title,
    kind: "product",
    bodyMd: renderPromoBody(p),
    tags: ["promo", p.type, p.bank_name ?? ""].filter(Boolean),
    aliases: [p.title],
    refTable: "promotions",
    refId: p.id,
    isPublished: p.is_active,
  });
  // Refresh "about" edges to applicable car models
  await query(
    `DELETE FROM sena_ev.wiki_edges
      WHERE from_kind = 'wiki_page' AND from_id = $1
        AND relation = 'about' AND to_kind = 'car_model'`,
    [wikiPage.id],
  );
  for (const modelId of p.applicable_model_ids ?? []) {
    await upsertEdge({
      fromKind: "wiki_page",
      fromId: wikiPage.id,
      toKind: "car_model",
      toId: modelId,
      relation: "about",
      source: "auto",
    });
  }
  return { action: p.is_active ? "upserted" : "unpublished", slug };
}

/* ─────────────── bulk ─────────────── */

export async function syncAllSharedWiki(): Promise<{
  cars: number;
  showrooms: number;
  promos: number;
}> {
  const ids = await Promise.all([
    query<{ id: string }>(`SELECT id FROM sena_ev.car_models`),
    query<{ id: string }>(`SELECT id FROM sena_ev.showrooms`),
    query<{ id: string }>(`SELECT id FROM sena_ev.promotions`),
  ]);
  for (const { id } of ids[0].rows) await syncCarWikiPage(id);
  for (const { id } of ids[1].rows) await syncShowroomWikiPage(id);
  for (const { id } of ids[2].rows) await syncPromoWikiPage(id);
  return {
    cars: ids[0].rows.length,
    showrooms: ids[1].rows.length,
    promos: ids[2].rows.length,
  };
}
