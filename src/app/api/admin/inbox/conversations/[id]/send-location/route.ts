import { NextResponse } from "next/server";
import { saveOutboundMessage } from "@/lib/conversations";
import { queryOne } from "@/lib/db";
import { sendLineMessage } from "@/lib/line/send";
import { emitInboxEvent } from "@/lib/sse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await req.json()) as {
    title?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    quotedMessageId?: string | null;
  };
  if (
    !body.title ||
    !body.address ||
    typeof body.latitude !== "number" ||
    typeof body.longitude !== "number"
  ) {
    return NextResponse.json(
      { error: "title, address, latitude, longitude required" },
      { status: 400 },
    );
  }

  const conversation = await queryOne<{ line_user_id: string }>(
    `SELECT cust.line_user_id
     FROM sena_ev.conversations c
     JOIN sena_ev.customers cust ON cust.id = c.customer_id
     WHERE c.id = $1`,
    [id],
  );
  if (!conversation) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  try {
    const { mode, lineMessageId } = await sendLineMessage({
      conversationId: id,
      lineUserId: conversation.line_user_id,
      quotedMessageId: body.quotedMessageId ?? null,
      message: {
        type: "location",
        title: body.title,
        address: body.address,
        latitude: body.latitude,
        longitude: body.longitude,
      },
    });

    const saved = await saveOutboundMessage({
      conversationId: id,
      agentId: null,
      messageType: "location",
      content: {
        title: body.title,
        address: body.address,
        latitude: body.latitude,
        longitude: body.longitude,
      },
      preview: `📍 ${body.title}`,
      quotedMessageId: body.quotedMessageId ?? null,
      lineMessageId,
    });

    emitInboxEvent({
      type: "status_change",
      conversationId: id,
      status: "replied",
      at: Date.now(),
    });

    return NextResponse.json({ ok: true, messageId: saved.id, mode });
  } catch (err) {
    console.error("[send-location] failed:", err);
    return NextResponse.json(
      { error: "send failed", detail: String(err) },
      { status: 502 },
    );
  }
}
