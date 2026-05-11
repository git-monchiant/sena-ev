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
    text?: string;
    internalNote?: boolean;
    quotedMessageId?: string | null;
  };
  const text = body.text?.trim();
  if (!text) {
    return NextResponse.json({ error: "text required" }, { status: 400 });
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

  const isNote = body.internalNote === true;
  let usedMode: "reply" | "push" | "skipped" = "skipped";
  let lineMessageId: string | null = null;

  if (!isNote) {
    try {
      const result = await sendLineMessage({
        conversationId: id,
        lineUserId: conversation.line_user_id,
        quotedMessageId: body.quotedMessageId ?? null,
        message: { type: "text", text },
      });
      usedMode = result.mode;
      lineMessageId = result.lineMessageId;
    } catch (err) {
      console.error("[reply] send failed:", err);
      return NextResponse.json(
        { error: "LINE send failed", detail: String(err) },
        { status: 502 },
      );
    }
  }

  const saved = await saveOutboundMessage({
    conversationId: id,
    agentId: null,
    messageType: "text",
    content: { text },
    isInternalNote: isNote,
    preview: isNote ? `[note] ${text}` : text,
    quotedMessageId: body.quotedMessageId ?? null,
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
