import "server-only";
import type { messagingApi } from "@line/bot-sdk";
import { getCarModelById } from "../car-models";
import { query, queryOne } from "../db";

const ACCENT = "#15803D";
const TEXT_PRIMARY = "#0F172A";
const TEXT_LABEL = "#94A3B8";
const TEXT_BODY = "#334155";

const LOGO_URL =
  process.env.NEXT_PUBLIC_LOGO_URL ??
  (process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/sena-ev-logo.png`
    : "https://senaev.ngrok.app/sena-ev-logo.png");

export type MaterialFlexInput = {
  slug: string;
  title: string;
  bodyMd: string;
  refTable: string | null;
  refId: string | null;
};

export type MaterialFlexResult = {
  flex: messagingApi.FlexMessage;
  /** FlexCardData-shape for admin inbox renderer */
  summary: {
    category: "car" | "promo" | "pin" | "material";
    title: string;
    subtitle: string | null;
    imageUrl: string | null;
    ctaLabel: string | null;
    ctaUrl: string | null;
    details: { label: string; value: string }[];
  };
};

export async function buildMaterialFlex(
  input: MaterialFlexInput,
): Promise<MaterialFlexResult | null> {
  if (input.refTable === "car_models" && input.refId) {
    return buildCarFlex(input.refId);
  }
  if (input.refTable === "showrooms" && input.refId) {
    return buildShowroomFlex(input.refId);
  }
  if (input.refTable === "promotions" && input.refId) {
    return buildPromoFlex(input.refId);
  }
  // Generic fallback: title + body snippet
  return buildGenericFlex(input);
}

/* ─────────────────── helpers ─────────────────── */

function row(
  label: string,
  value: string,
  wrap = false,
): messagingApi.FlexComponent {
  return {
    type: "box",
    layout: "horizontal",
    spacing: "md",
    contents: [
      {
        type: "text",
        text: label,
        size: "sm",
        color: TEXT_LABEL,
        flex: 2,
      },
      {
        type: "text",
        text: value,
        size: "sm",
        color: TEXT_BODY,
        weight: "bold",
        flex: 5,
        align: "end",
        wrap,
      },
    ],
  };
}

function headerWithLogo(
  pillLabel: string,
  pillBg: string,
  pillFg: string,
): messagingApi.FlexComponent {
  return {
    type: "box",
    layout: "horizontal",
    alignItems: "center",
    spacing: "md",
    contents: [
      {
        type: "image",
        url: LOGO_URL,
        size: "140px",
        aspectMode: "fit",
        aspectRatio: "1794:400",
        flex: 0,
        align: "start",
      },
      { type: "filler" },
      {
        type: "box",
        layout: "vertical",
        backgroundColor: pillBg,
        cornerRadius: "16px",
        paddingStart: "12px",
        paddingEnd: "12px",
        paddingTop: "5px",
        paddingBottom: "5px",
        flex: 0,
        contents: [
          {
            type: "text",
            text: pillLabel,
            color: pillFg,
            size: "xs",
            weight: "bold",
          },
        ],
      },
    ],
  };
}

/* ─────────────────── car_models ─────────────────── */

async function buildCarFlex(
  modelId: string,
): Promise<MaterialFlexResult | null> {
  const m = await getCarModelById(modelId);
  if (!m) return null;

  const branded = m.name.toUpperCase().startsWith(m.brand.toUpperCase())
    ? m.name
    : `${m.brand} ${m.name}`;

  const rows: messagingApi.FlexComponent[] = [];
  if (m.priceBaht != null)
    rows.push(row("ราคาเริ่มต้น", `${m.priceBaht.toLocaleString()} บาท`));
  if (m.rangeKm != null) rows.push(row("ระยะวิ่ง", `${m.rangeKm} km`));
  if (m.batteryKwh != null) rows.push(row("แบตเตอรี่", `${m.batteryKwh} kWh`));
  if (m.motorHp != null) rows.push(row("มอเตอร์", `${m.motorHp} hp`));
  if (m.zeroToHundredS != null)
    rows.push(row("0-100", `${m.zeroToHundredS} วินาที`));
  if (m.chargingDcKw != null)
    rows.push(row("ชาร์จเร็ว", `${m.chargingDcKw} kW DC`));

  const footerButtons: messagingApi.FlexComponent[] = [];
  if (m.brochureUrl) {
    footerButtons.push({
      type: "button",
      style: "primary",
      color: ACCENT,
      height: "sm",
      action: { type: "uri", label: "ดู Brochure", uri: m.brochureUrl },
    });
  }
  footerButtons.push({
    type: "button",
    style: "secondary",
    height: "sm",
    action: {
      type: "uri",
      label: "จองทดลองขับ",
      uri: liffUri(`test-drive?model=${m.slug}`),
    },
  });

  const bubble: messagingApi.FlexBubble = {
    type: "bubble",
    size: "mega",
    body: {
      type: "box",
      layout: "vertical",
      paddingAll: "22px",
      contents: [
        headerWithLogo("รุ่นรถ", "#DCFCE7", ACCENT),
        ...(m.images[0]
          ? [
              {
                type: "image" as const,
                url: m.images[0],
                aspectRatio: "16:9",
                aspectMode: "cover" as const,
                margin: "lg",
              },
            ]
          : []),
        {
          type: "text",
          text: branded,
          weight: "bold",
          size: "xl",
          color: TEXT_PRIMARY,
          margin: "lg",
        },
        ...(m.bodyType
          ? [
              {
                type: "text" as const,
                text: m.bodyType,
                size: "sm",
                color: TEXT_LABEL,
                margin: "xs",
              },
            ]
          : []),
        { type: "separator", margin: "lg", color: "#E2E8F0" },
        {
          type: "box",
          layout: "vertical",
          spacing: "sm",
          margin: "lg",
          contents: rows,
        },
      ],
    },
    footer: {
      type: "box",
      layout: "vertical",
      spacing: "sm",
      paddingStart: "22px",
      paddingEnd: "22px",
      paddingBottom: "18px",
      paddingTop: "0px",
      contents: footerButtons,
    },
  };

  return {
    flex: { type: "flex", altText: branded, contents: bubble },
    summary: {
      category: "car",
      title: branded,
      subtitle: m.bodyType,
      imageUrl: m.images[0] ?? null,
      ctaLabel: m.brochureUrl ? "ดู Brochure" : null,
      ctaUrl: m.brochureUrl,
      details: rows
        .map((r) => extractRow(r))
        .filter((d): d is { label: string; value: string } => d != null),
    },
  };
}

/* ─────────────────── showrooms ─────────────────── */

async function buildShowroomFlex(
  showroomId: string,
): Promise<MaterialFlexResult | null> {
  const r = await queryOne<{
    slug: string;
    name: string;
    address: string;
    phone: string | null;
    opens_at: string | null;
    closes_at: string | null;
    services: string[] | null;
    gmap_url: string | null;
    lat: string | null;
    lng: string | null;
  }>(
    `SELECT slug, name, address, phone, opens_at::text, closes_at::text,
            services, gmap_url, lat::text, lng::text
       FROM sena_ev.showrooms WHERE id = $1`,
    [showroomId],
  );
  if (!r) return null;

  const hours =
    r.opens_at && r.closes_at
      ? `${r.opens_at.slice(0, 5)}-${r.closes_at.slice(0, 5)}`
      : "—";
  const mapUrl =
    r.gmap_url ??
    (r.lat && r.lng
      ? `https://www.google.com/maps?q=${r.lat},${r.lng}`
      : null);

  const rows: messagingApi.FlexComponent[] = [
    row("ที่อยู่", r.address, true),
    row("เปิด", hours),
  ];
  if (r.phone) rows.push(row("โทร", r.phone));
  if (r.services && r.services.length > 0)
    rows.push(row("บริการ", r.services.join(", "), true));

  const footerButtons: messagingApi.FlexComponent[] = [];
  if (mapUrl) {
    footerButtons.push({
      type: "button",
      style: "primary",
      color: ACCENT,
      height: "sm",
      action: { type: "uri", label: "เปิดแผนที่", uri: mapUrl },
    });
  }
  if (r.phone) {
    footerButtons.push({
      type: "button",
      style: "secondary",
      height: "sm",
      action: { type: "uri", label: "โทร", uri: `tel:${r.phone}` },
    });
  }

  const bubble: messagingApi.FlexBubble = {
    type: "bubble",
    size: "mega",
    body: {
      type: "box",
      layout: "vertical",
      paddingAll: "22px",
      contents: [
        headerWithLogo("โชว์รูม", "#E0F2FE", "#0369A1"),
        {
          type: "text",
          text: r.name,
          weight: "bold",
          size: "xl",
          color: TEXT_PRIMARY,
          margin: "lg",
          wrap: true,
        },
        { type: "separator", margin: "lg", color: "#E2E8F0" },
        {
          type: "box",
          layout: "vertical",
          spacing: "sm",
          margin: "lg",
          contents: rows,
        },
      ],
    },
    footer: {
      type: "box",
      layout: "vertical",
      spacing: "sm",
      paddingStart: "22px",
      paddingEnd: "22px",
      paddingBottom: "18px",
      paddingTop: "0px",
      contents: footerButtons,
    },
  };

  return {
    flex: { type: "flex", altText: r.name, contents: bubble },
    summary: {
      category: "pin",
      title: r.name,
      subtitle: hours,
      imageUrl: null,
      ctaLabel: mapUrl ? "เปิดแผนที่" : null,
      ctaUrl: mapUrl,
      details: rows
        .map((c) => extractRow(c))
        .filter((d): d is { label: string; value: string } => d != null),
    },
  };
}

/* ─────────────────── promotions ─────────────────── */

async function buildPromoFlex(
  promoId: string,
): Promise<MaterialFlexResult | null> {
  const r = await queryOne<{
    slug: string;
    title: string;
    description: string | null;
    type: string;
    badge: string | null;
    bank_name: string | null;
    valid_to: string | null;
    payload: Record<string, unknown>;
  }>(
    `SELECT slug, title, description, type, badge, bank_name,
            valid_to::text, payload
       FROM sena_ev.promotions WHERE id = $1`,
    [promoId],
  );
  if (!r) return null;

  const rows: messagingApi.FlexComponent[] = [];
  const payload = r.payload ?? {};
  if (typeof payload.rate === "number")
    rows.push(row("อัตรา", `${payload.rate}%`));
  if (typeof payload.months === "number")
    rows.push(row("ระยะเวลา", `${payload.months} เดือน`));
  if (r.bank_name) rows.push(row("ธนาคาร", r.bank_name));
  if (typeof payload.max_value_baht === "number")
    rows.push(
      row(
        "มูลค่าสูงสุด",
        `${(payload.max_value_baht as number).toLocaleString()} บาท`,
      ),
    );
  if (r.valid_to) rows.push(row("มีผลถึง", r.valid_to.slice(0, 10)));

  const bubble: messagingApi.FlexBubble = {
    type: "bubble",
    size: "mega",
    body: {
      type: "box",
      layout: "vertical",
      paddingAll: "22px",
      contents: [
        headerWithLogo("โปรโมชั่น", "#FEF3C7", "#92400E"),
        {
          type: "text",
          text: r.title,
          weight: "bold",
          size: "xl",
          color: TEXT_PRIMARY,
          margin: "lg",
          wrap: true,
        },
        ...(r.description
          ? [
              {
                type: "text" as const,
                text: r.description,
                size: "sm",
                color: TEXT_LABEL,
                margin: "sm",
                wrap: true,
              },
            ]
          : []),
        { type: "separator", margin: "lg", color: "#E2E8F0" },
        {
          type: "box",
          layout: "vertical",
          spacing: "sm",
          margin: "lg",
          contents: rows,
        },
      ],
    },
  };

  return {
    flex: { type: "flex", altText: r.title, contents: bubble },
    summary: {
      category: "promo",
      title: r.title,
      subtitle: r.description,
      imageUrl: null,
      ctaLabel: null,
      ctaUrl: null,
      details: rows
        .map((c) => extractRow(c))
        .filter((d): d is { label: string; value: string } => d != null),
    },
  };
}

/* ─────────────────── generic fallback ─────────────────── */

async function buildGenericFlex(
  input: MaterialFlexInput,
): Promise<MaterialFlexResult> {
  const snippet = input.bodyMd.replace(/\*\*/g, "").slice(0, 200);
  const bubble: messagingApi.FlexBubble = {
    type: "bubble",
    size: "mega",
    body: {
      type: "box",
      layout: "vertical",
      paddingAll: "22px",
      contents: [
        headerWithLogo("ข้อมูล", "#F1F5F9", "#475569"),
        {
          type: "text",
          text: input.title,
          weight: "bold",
          size: "xl",
          color: TEXT_PRIMARY,
          margin: "lg",
          wrap: true,
        },
        {
          type: "text",
          text: snippet,
          size: "sm",
          color: TEXT_BODY,
          margin: "lg",
          wrap: true,
        },
      ],
    },
  };
  return {
    flex: { type: "flex", altText: input.title, contents: bubble },
    summary: {
      category: "material",
      title: input.title,
      subtitle: null,
      imageUrl: null,
      ctaLabel: null,
      ctaUrl: null,
      details: [],
    },
  };
}

/* ─────────────────── support ─────────────────── */

function liffUri(slug: string): string {
  const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
  if (liffId) return `https://liff.line.me/${liffId}/${slug}`;
  return `https://senagreenauto.co.th/liff/${slug}`;
}

function extractRow(
  c: messagingApi.FlexComponent,
): { label: string; value: string } | null {
  if (c.type !== "box" || c.layout !== "horizontal") return null;
  const texts = (c.contents ?? [])
    .filter((x): x is messagingApi.FlexText => x.type === "text")
    .map((x) => x.text);
  if (texts.length !== 2) return null;
  return { label: texts[0]!, value: texts[1]! };
}

// Silence unused import (kept for future tool needs)
void query;
