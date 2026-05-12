import "server-only";
import type { messagingApi } from "@line/bot-sdk";
import {
  getOrCreateConversation,
  saveOutboundMessage,
} from "../conversations";
import { getMessagingClient } from "./client";

type FlexParams = {
  type: "service" | "test_drive";
  subtype?: string | null;
  title: string;
  scheduledAt: Date;
  location: string;
  showroomAddress?: string | null;
  showroomLat?: number | null;
  showroomLng?: number | null;
  showroomGmapUrl?: string | null;
  durationMinutes?: number;
  notes?: string | null;
  modelName?: string | null;
  mileageKm?: number | null;
  scheduleId: string;
  sentAt?: Date;
};

function directionsUrl(p: FlexParams): string | null {
  if (p.showroomGmapUrl) return p.showroomGmapUrl;
  if (p.showroomLat != null && p.showroomLng != null) {
    return `https://www.google.com/maps/dir/?api=1&destination=${p.showroomLat},${p.showroomLng}`;
  }
  if (p.showroomAddress) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(p.showroomAddress)}`;
  }
  if (p.location) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(p.location)}`;
  }
  return null;
}

const SUBTYPE_LABEL: Record<string, string> = {
  maintenance: "เช็คระยะ",
  repair: "ซ่อม",
  inspection: "ตรวจสภาพ",
  body_shop: "ซ่อมสีและตัวถัง",
  tire: "บริการยาง/ล้อ",
};

const PILL: Record<
  string,
  { label: string; bg: string; fg: string }
> = {
  service: {
    label: "นัดเซอร์วิส",
    bg: "#E0F2FE",
    fg: "#0369A1",
  },
  test_drive: {
    label: "นัดทดลองขับ",
    bg: "#EDE9FE",
    fg: "#6D28D9",
  },
};

const CANCEL_PILL = {
  label: "ยกเลิกแล้ว",
  bg: "#FEE2E2",
  fg: "#B91C1C",
};

const ACCENT = "#14B8A6";          // teal CTA
const TEXT_PRIMARY = "#0F172A";
const TEXT_LABEL = "#94A3B8";
const TEXT_BODY = "#334155";
const BRAND_EV = "#15803D";

const LOGO_URL =
  process.env.NEXT_PUBLIC_LOGO_URL ??
  (process.env.NEXT_PUBLIC_BASE_URL
    ? `${process.env.NEXT_PUBLIC_BASE_URL}/sena-ev-logo.png`
    : "https://senaev.ngrok.app/sena-ev-logo.png");

function fmtThaiDate(d: Date): string {
  // "เสาร์ที่ 16 พ.ค. 2569"
  const weekday = d.toLocaleDateString("th-TH", {
    weekday: "long",
    timeZone: "Asia/Bangkok",
  });
  const rest = d.toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Bangkok",
  });
  return `${weekday.replace("วัน", "")}ที่ ${rest}`;
}

function fmtThaiTime(d: Date): string {
  return d.toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Bangkok",
  });
}

function fmtSentAt(d: Date): string {
  return d.toLocaleString("th-TH", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Bangkok",
  });
}

function liffUri(slug: string, id?: string): string {
  const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
  const path = id ? `${slug}?id=${id}` : slug;
  if (liffId) return `https://liff.line.me/${liffId}/${path}`;
  return `https://senagreenauto.co.th/liff/${path}`;
}

function infoRow(
  label: string,
  value: string,
  opts: { wrap?: boolean } = {},
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
        wrap: opts.wrap ?? false,
      },
    ],
  };
}

export function buildBookingFlex(
  p: FlexParams,
): messagingApi.FlexMessage {
  const pill = PILL[p.type] ?? PILL.service!;
  const sub = p.subtype && SUBTYPE_LABEL[p.subtype];
  const subLine = p.type === "test_drive" && p.modelName ? p.modelName : sub;

  const startTime = fmtThaiTime(p.scheduledAt);
  const endDate = new Date(
    p.scheduledAt.getTime() + (p.durationMinutes ?? 60) * 60 * 1000,
  );
  const endTime = fmtThaiTime(endDate);

  const rows: messagingApi.FlexComponent[] = [
    infoRow("เวลา", `${startTime} - ${endTime}`),
    infoRow("สาขา", p.location),
  ];
  if (p.mileageKm != null) {
    rows.push(
      infoRow("เลขไมล์", `${p.mileageKm.toLocaleString("en-US")} กม.`),
    );
  }
  if (p.notes) {
    rows.push(infoRow("บันทึก", p.notes, { wrap: true }));
  }

  const bubble: messagingApi.FlexBubble = {
    type: "bubble",
    size: "mega",
    body: {
      type: "box",
      layout: "vertical",
      paddingAll: "22px",
      spacing: "none",
      backgroundColor: "#FFFFFF",
      contents: [
        // Top row: real logo image + pill
        {
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
              backgroundColor: pill.bg,
              cornerRadius: "16px",
              paddingStart: "12px",
              paddingEnd: "12px",
              paddingTop: "5px",
              paddingBottom: "5px",
              flex: 0,
              contents: [
                {
                  type: "text",
                  text: pill.label,
                  color: pill.fg,
                  size: "xs",
                  weight: "bold",
                  align: "center",
                },
              ],
            },
          ],
        },

        // Date
        {
          type: "text",
          text: fmtThaiDate(p.scheduledAt),
          weight: "bold",
          size: "xl",
          color: TEXT_PRIMARY,
          wrap: true,
          margin: "lg",
        },

        // Subtype / model line
        ...(subLine
          ? [
              {
                type: "text" as const,
                text: subLine,
                size: "sm",
                color: TEXT_LABEL,
                margin: "xs",
              },
            ]
          : []),

        { type: "separator", margin: "lg", color: "#E2E8F0" },

        // Info rows
        {
          type: "box",
          layout: "vertical",
          spacing: "sm",
          margin: "lg",
          contents: rows,
        },

        // Sent at
        {
          type: "text",
          text: `ส่งเมื่อ ${fmtSentAt(p.sentAt ?? new Date())}`,
          size: "xxs",
          color: TEXT_LABEL,
          align: "end",
          margin: "lg",
        },
      ],
    },
    footer: {
      type: "box",
      layout: "vertical",
      paddingStart: "22px",
      paddingEnd: "22px",
      paddingTop: "0px",
      paddingBottom: "18px",
      spacing: "sm",
      contents: [
        {
          type: "button",
          style: "primary",
          color: ACCENT,
          height: "sm",
          action: {
            type: "uri",
            label:
              p.type === "service" ? "ดูรายละเอียดเซอร์วิส" : "ดูรายละเอียดนัด",
            uri: liffUri(p.type === "service" ? "service" : "test-drive"),
          },
        },
        ...(directionsUrl(p)
          ? [
              {
                type: "button" as const,
                style: "secondary" as const,
                height: "sm" as const,
                action: {
                  type: "uri" as const,
                  label: "เส้นทาง",
                  uri: directionsUrl(p)!,
                },
              },
            ]
          : []),
      ],
    },
    styles: {
      footer: { separator: false },
    },
  };

  return {
    type: "flex",
    altText: `${pill.label} ${fmtThaiDate(p.scheduledAt)} ${startTime}`,
    contents: bubble,
  };
}

export function buildBookingCancelFlex(
  p: FlexParams,
): messagingApi.FlexMessage {
  const pill = CANCEL_PILL;
  const typePill = PILL[p.type] ?? PILL.service!;
  const sub = p.subtype && SUBTYPE_LABEL[p.subtype];
  const subLine = p.type === "test_drive" && p.modelName ? p.modelName : sub;

  const startTime = fmtThaiTime(p.scheduledAt);
  const endDate = new Date(
    p.scheduledAt.getTime() + (p.durationMinutes ?? 60) * 60 * 1000,
  );
  const endTime = fmtThaiTime(endDate);

  const rows: messagingApi.FlexComponent[] = [
    infoRow("เวลา", `${startTime} - ${endTime}`),
    infoRow("สาขา", p.location),
  ];

  const bubble: messagingApi.FlexBubble = {
    type: "bubble",
    size: "mega",
    body: {
      type: "box",
      layout: "vertical",
      paddingAll: "22px",
      spacing: "none",
      backgroundColor: "#FFFFFF",
      contents: [
        {
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
              backgroundColor: pill.bg,
              cornerRadius: "16px",
              paddingStart: "12px",
              paddingEnd: "12px",
              paddingTop: "5px",
              paddingBottom: "5px",
              flex: 0,
              contents: [
                {
                  type: "text",
                  text: pill.label,
                  color: pill.fg,
                  size: "xs",
                  weight: "bold",
                  align: "center",
                },
              ],
            },
          ],
        },
        {
          type: "text",
          text: `ยกเลิก${typePill.label}`,
          weight: "bold",
          size: "xl",
          color: CANCEL_PILL.fg,
          margin: "lg",
        },
        {
          type: "text",
          text: fmtThaiDate(p.scheduledAt),
          size: "sm",
          color: CANCEL_PILL.fg,
          decoration: "line-through",
          margin: "xs",
        },
        ...(subLine
          ? [
              {
                type: "text" as const,
                text: subLine,
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
        {
          type: "text",
          text:
            p.type === "service"
              ? "สามารถจองใหม่ได้ทันทีที่หน้านัดเซอร์วิส"
              : "สามารถจองใหม่ได้ทันทีที่หน้านัดทดลองขับ",
          size: "xs",
          color: TEXT_LABEL,
          margin: "lg",
          wrap: true,
        },
        {
          type: "text",
          text: `ยกเลิกเมื่อ ${fmtSentAt(p.sentAt ?? new Date())}`,
          size: "xxs",
          color: TEXT_LABEL,
          align: "end",
          margin: "lg",
        },
      ],
    },
    footer: {
      type: "box",
      layout: "vertical",
      paddingStart: "22px",
      paddingEnd: "22px",
      paddingTop: "0px",
      paddingBottom: "18px",
      spacing: "sm",
      contents: [
        {
          type: "button",
          style: "primary",
          color: ACCENT,
          height: "sm",
          action: {
            type: "uri",
            label: p.type === "service" ? "จองเซอร์วิสใหม่" : "จองทดลองขับใหม่",
            uri: liffUri(p.type === "service" ? "service" : "test-drive"),
          },
        },
      ],
    },
  };

  return {
    type: "flex",
    altText: `${pill.label} · ${fmtThaiDate(p.scheduledAt)} ${startTime}`,
    contents: bubble,
  };
}

export async function pushBookingCancellation(
  lineUserId: string,
  customerId: string | null,
  params: FlexParams,
): Promise<void> {
  const client = getMessagingClient();
  const flex = buildBookingCancelFlex(params);
  const res = await client.pushMessage({
    to: lineUserId,
    messages: [flex],
  });

  if (!customerId) return;

  try {
    const startTime = fmtThaiTime(params.scheduledAt);
    const endDate = new Date(
      params.scheduledAt.getTime() +
        (params.durationMinutes ?? 60) * 60 * 1000,
    );
    const endTime = fmtThaiTime(endDate);

    const typePill = PILL[params.type] ?? PILL.service!;
    const cancelTitle = `ยกเลิก${typePill.label}`;
    const summary = {
      category: "booking",
      kind: "cancel" as const,
      title: cancelTitle,
      bodyText: `${fmtThaiDate(params.scheduledAt)} ${startTime}`,
      imageUrl: null as string | null,
      ctaLabel: params.type === "service" ? "จองเซอร์วิสใหม่" : "จองทดลองขับใหม่",
      ctaUrl: liffUri(params.type === "service" ? "service" : "test-drive"),
      details: [
        { label: "เวลา", value: `${startTime} - ${endTime}` },
        { label: "สาขา", value: params.location },
      ],
    };

    const conv = await getOrCreateConversation(customerId);
    await saveOutboundMessage({
      conversationId: conv.id,
      agentId: null,
      messageType: "flex",
      content: summary,
      preview: `${cancelTitle} · ${fmtThaiDate(params.scheduledAt)} ${startTime}`,
      lineMessageId: res.sentMessages?.[0]?.id ?? null,
    });
  } catch (err) {
    console.error("[booking] save cancel flex failed", err);
  }
}

export async function pushBookingConfirmation(
  lineUserId: string,
  customerId: string | null,
  params: FlexParams,
): Promise<void> {
  const client = getMessagingClient();
  const flex = buildBookingFlex(params);
  const res = await client.pushMessage({
    to: lineUserId,
    messages: [flex],
  });

  if (!customerId) return;

  // Save outbound message into admin inbox (FlexCardData summary)
  try {
    const pill = PILL[params.type] ?? PILL.service!;
    const startTime = fmtThaiTime(params.scheduledAt);
    const endDate = new Date(
      params.scheduledAt.getTime() +
        (params.durationMinutes ?? 60) * 60 * 1000,
    );
    const endTime = fmtThaiTime(endDate);

    const details: { label: string; value: string }[] = [
      { label: "เวลา", value: `${startTime} - ${endTime}` },
      { label: "สาขา", value: params.location },
    ];
    if (params.mileageKm != null) {
      details.push({
        label: "เลขไมล์",
        value: `${params.mileageKm.toLocaleString("en-US")} กม.`,
      });
    }
    if (params.notes) details.push({ label: "บันทึก", value: params.notes });

    const summary = {
      category: "booking",
      title: pill.label,
      bodyText: fmtThaiDate(params.scheduledAt),
      imageUrl: null as string | null,
      ctaLabel:
        params.type === "service" ? "ดูรายละเอียดเซอร์วิส" : "ดูรายละเอียดนัด",
      ctaUrl: liffUri(params.type === "service" ? "service" : "test-drive"),
      details,
    };

    const conv = await getOrCreateConversation(customerId);
    await saveOutboundMessage({
      conversationId: conv.id,
      agentId: null,
      messageType: "flex",
      content: summary,
      preview: `${pill.label} · ${fmtThaiDate(params.scheduledAt)} ${startTime}`,
      lineMessageId: res.sentMessages?.[0]?.id ?? null,
    });
  } catch (err) {
    console.error("[booking] save outbound flex failed", err);
  }
}
