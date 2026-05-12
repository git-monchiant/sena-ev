import { NextResponse } from "next/server";
import type { messagingApi } from "@line/bot-sdk";
import { saveOutboundMessage } from "@/lib/conversations";
import { queryOne } from "@/lib/db";
import { sendLineMessage } from "@/lib/line/send";
import { emitInboxEvent } from "@/lib/sse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type BubbleDetail = { label: string; value: string };
type BubbleCategory = "car" | "promo" | "pin" | null;
type BubbleInput = {
  title: string;
  bodyText?: string | null;
  imageUrl?: string | null;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  details?: BubbleDetail[];
  category?: BubbleCategory;
};

type Body = BubbleInput & {
  items?: BubbleInput[];
};

function buildBubble(
  input: BubbleInput,
  size: "micro" | "kilo" | "mega" = "mega",
): messagingApi.FlexBubble {
  const isMicro = size === "micro";
  const isCompact = size !== "mega";

  // Unified gap between sections — use parent box `spacing` instead of per-item `margin`
  const GAP: "md" = "md";

  const allDetails = (input.details ?? []).filter(
    (d) => d.label?.trim() && d.value?.trim(),
  );
  // Pull out price so it sits next to the title
  const priceDetail =
    allDetails.find((d) => d.label === "ราคาเริ่มต้น") ?? null;
  const restDetails = allDetails.filter((d) => d !== priceDetail);

  const titleSize: "sm" | "md" | "xl" = isMicro
    ? "sm"
    : isCompact
      ? "md"
      : "xl";

  const bodyContents: messagingApi.FlexComponent[] = [
    priceDetail && !isMicro
      ? {
          type: "box",
          layout: "baseline",
          spacing: "sm",
          contents: [
            {
              type: "text",
              text: input.title,
              weight: "bold",
              size: titleSize,
              wrap: true,
              color: "#0f172a",
              flex: 1,
            },
            {
              type: "text",
              text: priceDetail.value,
              weight: "bold",
              size: isCompact ? "xs" : "sm",
              color: "#1f5d3a",
              align: "end",
              flex: 0,
            },
          ],
        }
      : {
          type: "text",
          text: input.title,
          weight: "bold",
          size: titleSize,
          wrap: true,
          color: "#0f172a",
        },
  ];

  // Skip subtitle on micro to save vertical space
  if (input.bodyText && !isMicro) {
    bodyContents.push({
      type: "text",
      text: input.bodyText,
      size: "xs",
      color: "#94a3b8",
      wrap: true,
    });
  }

  // On micro: show only top 2 details from full list (incl price)
  const details = isMicro ? allDetails.slice(0, 2) : restDetails;

  if (details.length > 0) {
    if (!isMicro) {
      bodyContents.push({
        type: "separator",
        color: "#e5e7eb",
      });
    }

    if (isMicro) {
      bodyContents.push({
        type: "box",
        layout: "vertical",
        spacing: "none",
        contents: details.map((d) => ({
          type: "text",
          text: `${d.label} ${d.value}`,
          size: "xxs",
          color: "#475569",
          wrap: false,
        })),
      });
    } else {
      // 2-column grid: chunk details into rows of 2 (like LIFF catalog)
      const cell = (d: BubbleDetail): messagingApi.FlexBox => ({
        type: "box",
        layout: "vertical",
        spacing: "none",
        flex: 1,
        contents: [
          {
            type: "text",
            text: d.label,
            size: "xxs",
            color: "#94a3b8",
          },
          {
            type: "text",
            text: d.value,
            size: "xs",
            weight: "bold",
            color: "#0f172a",
            wrap: true,
          },
        ],
      });

      const rows: messagingApi.FlexBox[] = [];
      for (let i = 0; i < details.length; i += 2) {
        const row: messagingApi.FlexComponent[] = [cell(details[i]!)];
        if (details[i + 1]) row.push(cell(details[i + 1]!));
        else row.push({ type: "filler", flex: 1 });
        rows.push({
          type: "box",
          layout: "horizontal",
          spacing: "md",
          contents: row,
        });
      }

      bodyContents.push({
        type: "box",
        layout: "vertical",
        spacing: "sm",
        contents: rows,
      });
    }
  }

  // Match booking-flex spacing so both bubble families look identical
  const SIDE_PAD = isMicro ? "16px" : "22px";
  const BODY_PAD_V = isMicro ? "12px" : "20px";
  const FOOTER_PAD_BOTTOM = isMicro ? "12px" : "18px";

  return {
    type: "bubble",
    size,
    ...(input.imageUrl
      ? {
          hero: {
            type: "image",
            url: input.imageUrl,
            size: "full",
            aspectRatio: isMicro ? "1:1" : "5:3",
            aspectMode: "fit",
            backgroundColor: "#FFFFFF",
          },
        }
      : {}),
    body: {
      type: "box",
      layout: "vertical",
      contents: bodyContents,
      paddingStart: SIDE_PAD,
      paddingEnd: SIDE_PAD,
      paddingTop: BODY_PAD_V,
      paddingBottom: BODY_PAD_V,
      spacing: isMicro ? "xs" : GAP,
    },
    ...(input.ctaUrl
      ? {
          footer: {
            type: "box",
            layout: "vertical",
            spacing: "sm",
            paddingStart: SIDE_PAD,
            paddingEnd: SIDE_PAD,
            paddingTop: "0px",
            paddingBottom: FOOTER_PAD_BOTTOM,
            contents: [
              {
                type: "button",
                style: "primary",
                color: "#1f5d3a",
                height: "sm",
                action: {
                  type: "uri",
                  label: input.ctaLabel || "ดูเพิ่มเติม",
                  uri: input.ctaUrl,
                },
              },
            ],
          },
        }
      : {}),
  };
}

function normalize(b: BubbleInput): BubbleInput | null {
  const title = b.title?.trim();
  if (!title) return null;
  const imageUrl = b.imageUrl?.trim() || null;
  const ctaUrl = b.ctaUrl?.trim() || null;
  if (imageUrl && !/^https?:\/\//i.test(imageUrl)) return null;
  if (ctaUrl && !/^https?:\/\//i.test(ctaUrl)) return null;
  const details = Array.isArray(b.details)
    ? b.details
        .map((d) => ({
          label: String(d?.label ?? "").trim(),
          value: String(d?.value ?? "").trim(),
        }))
        .filter((d) => d.label && d.value)
    : [];
  const category: BubbleCategory =
    b.category === "car" || b.category === "promo" || b.category === "pin"
      ? b.category
      : null;
  return {
    title,
    bodyText: b.bodyText?.trim() || null,
    imageUrl,
    ctaLabel: b.ctaLabel?.trim() || null,
    ctaUrl,
    details,
    category,
  };
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await req.json()) as Body;

  // Carousel mode: items[] takes precedence over single bubble fields
  const rawItems =
    body.items && body.items.length > 0
      ? body.items
      : body.title
        ? [
            {
              title: body.title,
              bodyText: body.bodyText,
              imageUrl: body.imageUrl,
              ctaLabel: body.ctaLabel,
              ctaUrl: body.ctaUrl,
              details: body.details,
              category: body.category,
            },
          ]
        : [];

  const normalized = rawItems
    .map(normalize)
    .filter((x): x is BubbleInput => x != null)
    .slice(0, 12); // LINE carousel max

  if (normalized.length === 0) {
    return NextResponse.json(
      { error: "ต้องมีอย่างน้อย 1 รายการ และต้องมี title + URL ที่ถูกต้อง" },
      { status: 400 },
    );
  }

  const conversation = await queryOne<{
    id: string;
    customer_id: string;
    line_user_id: string;
  }>(
    `SELECT c.id, c.customer_id, cust.line_user_id
     FROM sena_ev.conversations c
     JOIN sena_ev.customers cust ON cust.id = c.customer_id
     WHERE c.id = $1`,
    [id],
  );
  if (!conversation) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const isCarousel = normalized.length > 1;
  const altText = isCarousel
    ? `${normalized[0]!.title} และอีก ${normalized.length - 1} รายการ`
    : normalized[0]!.title;

  const flexMessage: messagingApi.FlexMessage = {
    type: "flex",
    altText,
    contents: isCarousel
      ? {
          type: "carousel",
          contents: normalized.map((b) => buildBubble(b, "kilo")),
        }
      : buildBubble(normalized[0]!),
  };

  let usedMode: "reply" | "push" = "push";
  let lineMessageId: string | null = null;
  try {
    const result = await sendLineMessage({
      conversationId: id,
      lineUserId: conversation.line_user_id,
      message: flexMessage,
    });
    usedMode = result.mode;
    lineMessageId = result.lineMessageId;
  } catch (err) {
    console.error("[send-flex] failed:", err);
    return NextResponse.json(
      { error: "LINE send failed", detail: String(err) },
      { status: 502 },
    );
  }

  const content = isCarousel
    ? { type: "carousel" as const, items: normalized }
    : {
        title: normalized[0]!.title,
        bodyText: normalized[0]!.bodyText,
        imageUrl: normalized[0]!.imageUrl,
        ctaLabel: normalized[0]!.ctaUrl
          ? normalized[0]!.ctaLabel || "ดูเพิ่มเติม"
          : null,
        ctaUrl: normalized[0]!.ctaUrl,
        details: normalized[0]!.details ?? [],
        category: normalized[0]!.category ?? null,
      };

  const saved = await saveOutboundMessage({
    conversationId: id,
    agentId: null,
    messageType: "flex",
    content,
    isInternalNote: false,
    preview: isCarousel
      ? `[Carousel] ${normalized.length} รายการ`
      : `[Material] ${normalized[0]!.title}`,
    quotedMessageId: null,
    lineMessageId,
  });

  emitInboxEvent({
    type: "status_change",
    conversationId: id,
    status: "replied",
    at: Date.now(),
  });

  return NextResponse.json({ ok: true, messageId: saved.id, mode: usedMode });
}
