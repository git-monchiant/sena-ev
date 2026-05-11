import "server-only";
import type { messagingApi } from "@line/bot-sdk";
import {
  findUsableReplyToken,
  getQuoteTokenForMessage,
  markReplyTokenUsed,
} from "../conversations";
import { getMessagingClient } from "./client";

export type SendResult = {
  mode: "reply" | "push";
  lineMessageId: string | null;
};

export async function sendLineMessage(params: {
  conversationId: string;
  lineUserId: string;
  message: messagingApi.Message;
  quotedMessageId?: string | null;
}): Promise<SendResult> {
  const client = getMessagingClient();
  const replyToken = await findUsableReplyToken(params.conversationId);

  const messageWithQuote = { ...params.message } as messagingApi.Message & {
    quoteToken?: string;
  };
  if (params.quotedMessageId) {
    const qt = await getQuoteTokenForMessage(params.quotedMessageId);
    if (qt) messageWithQuote.quoteToken = qt;
  }

  if (replyToken) {
    const res = await client.replyMessage({
      replyToken,
      messages: [messageWithQuote],
    });
    await markReplyTokenUsed(replyToken);
    return { mode: "reply", lineMessageId: res.sentMessages?.[0]?.id ?? null };
  }
  const res = await client.pushMessage({
    to: params.lineUserId,
    messages: [messageWithQuote],
  });
  return { mode: "push", lineMessageId: res.sentMessages?.[0]?.id ?? null };
}
