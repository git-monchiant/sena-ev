import type { webhook } from "@line/bot-sdk";
import { NextResponse } from "next/server";
import {
  getOrCreateConversation,
  markMessageUnsentByLineId,
  saveInboundMessage,
} from "@/lib/conversations";
import {
  createFollowLead,
  getCustomerByLineUserId,
  markUnfollowed,
  syncMenuFromState,
  upsertCustomerOnFollow,
} from "@/lib/customer-state";
import { query } from "@/lib/db";
import { getMessagingClient } from "@/lib/line/client";
import { verifyWebhookSignature } from "@/lib/line/verify";
import { emitInboxEvent } from "@/lib/sse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const signature = req.headers.get("x-line-signature");
  if (!signature) {
    return NextResponse.json({ error: "missing signature" }, { status: 401 });
  }

  const body = await req.text();
  if (!verifyWebhookSignature(body, signature)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  const { events } = JSON.parse(body) as { events: webhook.Event[] };

  for (const event of events) {
    await logEvent(event);
    try {
      await handleEvent(event);
    } catch (err) {
      console.error(`[webhook] handler failed for ${event.type}:`, err);
    }
  }

  return NextResponse.json({ ok: true });
}

async function logEvent(event: webhook.Event) {
  try {
    await query(
      `INSERT INTO sena_ev.webhook_events (event_type, line_user_id, payload)
       VALUES ($1, $2, $3)`,
      [event.type, event.source?.userId ?? null, JSON.stringify(event)],
    );
  } catch (err) {
    console.error("[webhook] log failed:", err);
  }
}

async function ensureCustomer(userId: string) {
  let customer = await getCustomerByLineUserId(userId);
  if (!customer) {
    const profile = await getMessagingClient().getProfile(userId);
    customer = await upsertCustomerOnFollow({
      lineUserId: userId,
      displayName: profile.displayName,
      pictureUrl: profile.pictureUrl,
    });
  }
  return customer;
}

async function handleEvent(event: webhook.Event) {
  const userId = event.source?.userId;

  switch (event.type) {
    case "follow": {
      if (!userId) return;
      const profile = await getMessagingClient().getProfile(userId);
      const customer = await upsertCustomerOnFollow({
        lineUserId: userId,
        displayName: profile.displayName,
        pictureUrl: profile.pictureUrl,
      });
      const conversation = await getOrCreateConversation(customer.id);
      await createFollowLead(customer.id, profile.displayName);
      await syncMenuFromState(userId, "LEAD");
      emitInboxEvent({
        type: "new_message",
        conversationId: conversation.id,
        messageId: `follow-${customer.id}`,
        customerName: profile.displayName,
        preview: "เพิ่งกด add OA — lead ใหม่",
        messageType: "follow",
        at: Date.now(),
      });
      break;
    }
    case "unfollow": {
      if (!userId) return;
      await markUnfollowed(userId);
      break;
    }
    case "message": {
      if (!userId) return;
      const customer = await ensureCustomer(userId);
      const conversation = await getOrCreateConversation(customer.id);
      const messageEvent = event as webhook.MessageEvent;
      const message = messageEvent.message;
      const { messageType, preview, content } = parseMessage(message);
      const quoteToken = (message as { quoteToken?: string }).quoteToken ?? null;
      const quotedLineMessageId =
        (message as { quotedMessageId?: string }).quotedMessageId ?? null;

      const saved = await saveInboundMessage({
        conversationId: conversation.id,
        lineMessageId: message.id ?? null,
        replyToken: messageEvent.replyToken ?? null,
        quoteToken,
        quotedLineMessageId,
        messageType,
        content,
        rawPayload: messageEvent as unknown as Record<string, unknown>,
        preview,
      });
      if (!saved) return;

      emitInboxEvent({
        type: "new_message",
        conversationId: conversation.id,
        messageId: saved.id,
        customerName: customer.display_name ?? userId,
        preview,
        messageType,
        at: Date.now(),
      });
      break;
    }
    case "unsend": {
      const unsendEvent = event as webhook.UnsendEvent;
      const lineMsgId = unsendEvent.unsend?.messageId;
      if (!lineMsgId) return;
      const flagged = await markMessageUnsentByLineId(lineMsgId);
      if (flagged) {
        emitInboxEvent({
          type: "status_change",
          conversationId: flagged.conversation_id,
          status: "message_unsent",
          at: Date.now(),
        });
      }
      break;
    }
    case "postback":
      break;
    default:
      break;
  }
}

function parseMessage(message: webhook.MessageContent): {
  messageType: string;
  preview: string;
  content: Record<string, unknown>;
} {
  switch (message.type) {
    case "text":
      return {
        messageType: "text",
        preview: message.text,
        content: { text: message.text },
      };
    case "image":
      return {
        messageType: "image",
        preview: "[รูปภาพ]",
        content: { lineContentId: message.id },
      };
    case "video":
      return {
        messageType: "video",
        preview: "[วิดีโอ]",
        content: { lineContentId: message.id },
      };
    case "audio":
      return {
        messageType: "audio",
        preview: "[เสียง]",
        content: { lineContentId: message.id, duration: message.duration },
      };
    case "file":
      return {
        messageType: "file",
        preview: `[ไฟล์] ${message.fileName}`,
        content: {
          lineContentId: message.id,
          fileName: message.fileName,
          fileSize: message.fileSize,
        },
      };
    case "location":
      return {
        messageType: "location",
        preview: `📍 ${message.title ?? "ตำแหน่ง"}`,
        content: {
          title: message.title,
          address: message.address,
          latitude: message.latitude,
          longitude: message.longitude,
        },
      };
    case "sticker":
      return {
        messageType: "sticker",
        preview: "[สติกเกอร์]",
        content: {
          packageId: message.packageId,
          stickerId: message.stickerId,
        },
      };
    default: {
      const unknownMessage = message as { type: string };
      return {
        messageType: unknownMessage.type,
        preview: `[${unknownMessage.type}]`,
        content: unknownMessage as unknown as Record<string, unknown>,
      };
    }
  }
}
