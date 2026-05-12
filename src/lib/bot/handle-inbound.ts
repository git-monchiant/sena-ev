import "server-only";
import {
  getOrCreateConversation,
  saveOutboundMessage,
} from "../conversations";
import { query, queryOne } from "../db";
import { getMessagingClient } from "../line/client";
import { emitInboxEvent } from "../sse";
import { classifyEscalation } from "./escalation";
import { generateBotReply } from "./invoke";

export type HandleResult =
  | { action: "skipped"; reason: string }
  | { action: "escalated"; reason: string }
  | { action: "replied"; reply: string; toolCalls: string[] };

/**
 * Bot entry point for an inbound text message that has already been
 * saved into `messages`. Decides whether to reply, generates the reply
 * via Gemini + tools, pushes to LINE, and saves the outbound message.
 *
 * v1 policy:
 *  - text only (skip image/video/sticker/audio/file)
 *  - if rule-based classifier flags refund/complaint/legal/etc →
 *    set conversation status='pending', insert system note,
 *    send a holding reply.
 *  - if bot decides to escalate via tool call, the tool already marks
 *    the conversation; we just send the bot's reply text.
 *  - otherwise: bot answers freely.
 */
export async function handleInboundMessage(params: {
  lineUserId: string;
  customerId: string;
  conversationId: string;
  messageType: string;
  text: string | null;
}): Promise<HandleResult> {
  if (params.messageType !== "text") {
    return { action: "skipped", reason: `message_type=${params.messageType}` };
  }
  const text = (params.text ?? "").trim();
  if (!text) return { action: "skipped", reason: "empty_text" };

  // Per-conversation bot toggle — default OFF (agent must opt in)
  const flag = await queryOne<{ status: string; bot_enabled: boolean }>(
    `SELECT status, bot_enabled FROM sena_ev.conversations WHERE id = $1`,
    [params.conversationId],
  );
  if (flag?.status === "closed") {
    return { action: "skipped", reason: "conversation_closed" };
  }
  if (!flag?.bot_enabled) {
    return { action: "skipped", reason: "bot_disabled" };
  }

  // Pre-classify obvious "needs human" cases
  const escal = classifyEscalation(text);
  if (escal) {
    await markEscalated(params.conversationId, escal.reason, escal.matched);
    const holding = "ขอเช็คให้ก่อนนะคะ ทีมงานจะติดต่อกลับ";
    await sendAndSave(params, holding);
    return { action: "escalated", reason: escal.reason };
  }

  // Generate via Gemini (tools may also trigger escalate)
  const result = await generateBotReply({
    conversationId: params.conversationId,
    userText: text,
  });

  const reply = (result.reply ?? "").trim();
  if (reply) {
    await sendAndSave(params, reply);
  }

  return {
    action: "replied",
    reply,
    toolCalls: result.toolCalls.map((c) => c.name),
  };
}

async function markEscalated(
  conversationId: string,
  reason: string,
  matched: string,
): Promise<void> {
  await query(
    `INSERT INTO sena_ev.messages
       (conversation_id, direction, message_type, content, is_internal_note, sent_at)
     VALUES ($1, 'system', 'escalation', $2::jsonb, true, now())`,
    [
      conversationId,
      JSON.stringify({ reason, matched, source: "prefilter" }),
    ],
  );
  await query(
    `UPDATE sena_ev.conversations
        SET status = 'pending', updated_at = now()
      WHERE id = $1`,
    [conversationId],
  );
}

async function sendAndSave(
  params: { lineUserId: string; customerId: string; conversationId: string },
  text: string,
): Promise<void> {
  const client = getMessagingClient();
  let lineMessageId: string | null = null;
  try {
    const res = await client.pushMessage({
      to: params.lineUserId,
      messages: [{ type: "text", text }],
    });
    lineMessageId = res.sentMessages?.[0]?.id ?? null;
  } catch (err) {
    console.error("[bot] push failed", err);
  }

  try {
    const conv = await getOrCreateConversation(params.customerId);
    const saved = await saveOutboundMessage({
      conversationId: conv.id,
      agentId: null,
      messageType: "text",
      content: { text },
      preview: text.slice(0, 80),
      lineMessageId,
    });
    emitInboxEvent({
      type: "new_message",
      conversationId: conv.id,
      messageId: saved.id,
      customerName: "",
      preview: text.slice(0, 80),
      messageType: "text",
      at: Date.now(),
    });
  } catch (err) {
    console.error("[bot] save outbound failed", err);
  }
}
