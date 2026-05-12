import "server-only";
import {
  getCarModelBySlug,
  getActiveCarModels,
  type CarModel,
} from "../../car-models";
import { getActivePromotions, type Promotion } from "../../promotions";

function summary(m: CarModel) {
  return {
    slug: m.slug,
    name: m.name,
    brand: m.brand,
    body_type: m.bodyType,
    price_baht: m.priceBaht,
    range_km: m.rangeKm,
    battery_kwh: m.batteryKwh,
    motor_hp: m.motorHp,
    zero_to_hundred_s: m.zeroToHundredS,
    top_speed_kmh: m.topSpeedKmh,
    charging_dc_kw: m.chargingDcKw,
    brochure_url: m.brochureUrl,
    colors: m.colors,
  };
}

export async function lookupCarModel(
  slug: string,
): Promise<unknown> {
  const m = await getCarModelBySlug(slug);
  if (!m) return { error: `ไม่พบรุ่น slug="${slug}"` };
  return summary(m);
}

export async function listCarModels(
  opts: { brand?: string; priceMax?: number } = {},
): Promise<unknown> {
  const all = await getActiveCarModels();
  let rows = all;
  if (opts.brand) {
    const b = opts.brand.toLowerCase();
    rows = rows.filter((m) => m.brand.toLowerCase() === b);
  }
  if (opts.priceMax != null) {
    rows = rows.filter(
      (m) => m.priceBaht != null && m.priceBaht <= opts.priceMax!,
    );
  }
  return rows.map(summary);
}

function promoSummary(p: Promotion) {
  return {
    slug: p.slug,
    title: p.title,
    description: p.description,
    type: p.type,
    badge: p.badge,
    bank_name: p.bankName,
    valid_to: p.validTo,
    payload: p.payload,
    applicable_to_all_models: p.applicableModelIds.length === 0,
    applicable_model_ids: p.applicableModelIds,
  };
}

export async function listActivePromotions(
  modelSlug?: string,
): Promise<unknown> {
  const promos = await getActivePromotions();
  if (!modelSlug) return promos.map(promoSummary);

  const m = await getCarModelBySlug(modelSlug);
  if (!m) return { error: `ไม่พบรุ่น slug="${modelSlug}"` };
  return promos
    .filter(
      (p) =>
        p.applicableModelIds.length === 0 || p.applicableModelIds.includes(m.id),
    )
    .map(promoSummary);
}
