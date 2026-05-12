import { NextResponse } from "next/server";
import { getActiveCarModels } from "@/lib/car-models";
import { query } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export type MaterialCategory = "car" | "promo" | "pin";

export type MaterialDetail = { label: string; value: string };

export type MaterialItem = {
  id: string;
  category: MaterialCategory;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  ctaLabel: string | null;
  ctaUrl: string | null;
  details: MaterialDetail[];
  // pin-specific (for LINE location message)
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

type PromoRow = {
  slug: string;
  title: string;
  description: string | null;
  bank_name: string | null;
  badge: string | null;
};

type ShowroomRow = {
  slug: string;
  name: string;
  short_name: string | null;
  address: string | null;
  district: string | null;
  province: string | null;
  gmap_url: string | null;
  lat: string | null;
  lng: string | null;
};

export async function GET() {
  const [models, promosRes, roomsRes] = await Promise.all([
    getActiveCarModels(),
    query<PromoRow>(
      `SELECT slug, title, description, bank_name, badge
         FROM sena_ev.promotions
        WHERE is_active = true
        ORDER BY sort_order ASC, title ASC`,
    ),
    query<ShowroomRow>(
      `SELECT slug, name, short_name, address, district, province, gmap_url, lat, lng
         FROM sena_ev.showrooms
        WHERE is_active = true
        ORDER BY sort_order ASC, name ASC`,
    ),
  ]);

  const items: MaterialItem[] = [
    ...models.map<MaterialItem>((m) => {
      const details: MaterialDetail[] = [];
      if (m.priceBaht != null)
        details.push({
          label: "ราคาเริ่มต้น",
          value: `${m.priceBaht.toLocaleString()} บาท`,
        });
      if (m.rangeKm != null)
        details.push({ label: "ระยะทาง/ชาร์จ", value: `${m.rangeKm} km` });
      if (m.batteryKwh != null)
        details.push({ label: "แบตเตอรี่", value: `${m.batteryKwh} kWh` });
      if (m.motorHp != null)
        details.push({ label: "มอเตอร์", value: `${m.motorHp} hp` });
      if (m.zeroToHundredS != null)
        details.push({
          label: "0–100 km/h",
          value: `${m.zeroToHundredS} วินาที`,
        });
      if (m.chargingDcKw != null)
        details.push({ label: "ชาร์จเร็ว DC", value: `${m.chargingDcKw} kW` });
      return {
        id: `car:${m.slug}`,
        category: "car",
        title: m.name,
        subtitle: [m.brand, m.bodyType].filter(Boolean).join(" · ") || null,
        imageUrl: m.images[0] ?? null,
        ctaLabel: m.brochureUrl ? "รายละเอียด" : null,
        ctaUrl: m.brochureUrl,
        details,
      };
    }),
    ...promosRes.rows.map<MaterialItem>((p) => ({
      id: `promo:${p.slug}`,
      category: "promo",
      title: p.title,
      subtitle: [p.bank_name, p.description].filter(Boolean).join(" · ") || null,
      imageUrl: null,
      ctaLabel: null,
      ctaUrl: null,
      details: [],
    })),
    ...roomsRes.rows.map<MaterialItem>((r) => {
      const locationText = [r.district, r.province].filter(Boolean).join(", ");
      const fullAddress =
        r.address ?? locationText ?? r.short_name ?? r.name;
      return {
        id: `pin:${r.slug}`,
        category: "pin",
        title: r.name,
        subtitle: locationText || null,
        imageUrl: null,
        ctaLabel: null,
        ctaUrl: null,
        details: [],
        address: fullAddress,
        latitude: r.lat ? Number(r.lat) : null,
        longitude: r.lng ? Number(r.lng) : null,
      };
    }),
  ];

  return NextResponse.json({ items });
}
