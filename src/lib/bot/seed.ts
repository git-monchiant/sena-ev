import "server-only";
import { query } from "../db";
import { getActiveCarModels } from "../car-models";
import { getActivePromotions } from "../promotions";
import { getActiveShowrooms } from "../showrooms";
import { upsert as upsertEdge } from "./wiki/edges";
import { upsert as upsertWiki } from "./wiki/shared";

/**
 * Generate / refresh shared wiki pages from structured tables.
 *
 * Idempotent — safe to run multiple times. Existing pages are updated
 * in-place (slug is the natural key).
 *
 * Pages produced:
 *   car-<slug>         (one per active car_model)
 *   showroom-<slug>    (one per active showroom)
 *   promo-<slug>       (one per active promotion)
 *
 * Edges produced:
 *   promo wiki_page --about--> car_model (if applicable_model_ids set)
 */
export async function seedSharedWiki(): Promise<{
  cars: number;
  showrooms: number;
  promos: number;
  edges: number;
}> {
  const [models, showrooms, promos] = await Promise.all([
    getActiveCarModels(),
    getActiveShowrooms(),
    getActivePromotions(),
  ]);

  for (const m of models) {
    const branded = m.name.toUpperCase().startsWith(m.brand.toUpperCase())
      ? m.name
      : `${m.brand} ${m.name}`;

    const specs: string[] = [];
    if (m.priceBaht != null)
      specs.push(`- **ราคาเริ่มต้น**: ${m.priceBaht.toLocaleString()} บาท`);
    if (m.rangeKm != null) specs.push(`- **ระยะวิ่ง**: ${m.rangeKm} km`);
    if (m.batteryKwh != null) specs.push(`- **แบตเตอรี่**: ${m.batteryKwh} kWh`);
    if (m.motorHp != null) specs.push(`- **มอเตอร์**: ${m.motorHp} hp`);
    if (m.zeroToHundredS != null)
      specs.push(`- **0–100 km/h**: ${m.zeroToHundredS} วินาที`);
    if (m.topSpeedKmh != null)
      specs.push(`- **ความเร็วสูงสุด**: ${m.topSpeedKmh} km/h`);
    if (m.chargingDcKw != null)
      specs.push(`- **ชาร์จเร็ว DC**: ${m.chargingDcKw} kW`);

    const body = [
      `**${branded}**${m.bodyType ? ` · ${m.bodyType}` : ""}`,
      "",
      specs.join("\n"),
      m.brochureUrl ? `\n[Brochure](${m.brochureUrl})` : "",
    ]
      .filter(Boolean)
      .join("\n");

    await upsertWiki({
      slug: `car-${m.slug}`,
      title: branded,
      kind: "product",
      bodyMd: body,
      tags: ["car", m.brand.toLowerCase(), m.bodyType ?? ""].filter(Boolean),
      aliases: [m.name, branded, m.slug].filter(
        (v, i, a) => a.indexOf(v) === i,
      ),
      refTable: "car_models",
      refId: m.id,
    });
  }

  for (const s of showrooms) {
    const hours =
      s.opensAt && s.closesAt
        ? `${s.opensAt.slice(0, 5)}–${s.closesAt.slice(0, 5)}`
        : "—";
    const services = s.services.length > 0 ? s.services.join(", ") : "—";
    const body = [
      `**${s.name}**`,
      "",
      `- **ที่อยู่**: ${s.address}`,
      `- **เปิด**: ${hours}`,
      s.phone ? `- **โทร**: ${s.phone}` : "",
      `- **บริการ**: ${services}`,
      s.gmapUrl ? `\n[เปิดแผนที่](${s.gmapUrl})` : "",
    ]
      .filter(Boolean)
      .join("\n");

    await upsertWiki({
      slug: `showroom-${s.slug}`,
      title: s.name,
      kind: "product",
      bodyMd: body,
      tags: ["showroom", s.province ?? "", s.district ?? ""].filter(Boolean),
      aliases: [s.shortName ?? "", s.name].filter(Boolean),
      refTable: "showrooms",
      refId: s.id,
    });
  }

  let edgeCount = 0;
  for (const p of promos) {
    const payload = p.payload as Record<string, unknown>;
    const detail: string[] = [];
    if (typeof payload.rate === "number")
      detail.push(`- **อัตรา**: ${payload.rate}%`);
    if (typeof payload.months === "number")
      detail.push(`- **ระยะเวลา**: ${payload.months} เดือน`);
    if (p.bankName) detail.push(`- **ธนาคาร**: ${p.bankName}`);
    if (typeof payload.max_value_baht === "number")
      detail.push(
        `- **มูลค่าสูงสุด**: ${payload.max_value_baht.toLocaleString()} บาท`,
      );

    const body = [
      `**${p.title}**`,
      p.description ?? "",
      "",
      detail.join("\n"),
      p.validTo ? `\nมีผลถึง ${p.validTo}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const promoPage = await upsertWiki({
      slug: `promo-${p.slug}`,
      title: p.title,
      kind: "product",
      bodyMd: body,
      tags: ["promo", p.type, p.bankName ?? ""].filter(Boolean),
      aliases: [p.title],
    });

    // Link promo → applicable car_models
    for (const modelId of p.applicableModelIds) {
      await upsertEdge({
        fromKind: "wiki_page",
        fromId: promoPage.id,
        toKind: "car_model",
        toId: modelId,
        relation: "about",
        source: "auto",
      });
      edgeCount += 1;
    }
  }

  return {
    cars: models.length,
    showrooms: showrooms.length,
    promos: promos.length,
    edges: edgeCount,
  };
}

/**
 * Quick CLI-style helper: print the current count of wiki pages by kind.
 */
export async function wikiSummary(): Promise<Record<string, number>> {
  const r = await query<{ kind: string; n: number }>(
    `SELECT kind, COUNT(*)::int AS n
       FROM sena_ev.wiki_pages
      GROUP BY kind
      ORDER BY kind`,
  );
  const map: Record<string, number> = {};
  for (const row of r.rows) map[row.kind] = row.n;
  return map;
}
