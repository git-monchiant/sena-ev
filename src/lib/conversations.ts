import "server-only";
import { query, queryOne, withTransaction } from "./db";

export type ConversationRow = {
  id: string;
  customer_id: string;
  status: "open" | "pending" | "closed";
  last_message_at: Date | null;
  last_message_preview: string | null;
  last_message_type: string | null;
  unread_count: number;
};

export type ConversationListItem = ConversationRow & {
  customer_line_user_id: string;
  customer_display_name: string | null;
  customer_picture_url: string | null;
  customer_state: "LEAD" | "OWNER";
};

export type MessageRow = {
  id: string;
  conversation_id: string;
  direction: "inbound" | "outbound" | "system";
  agent_id: string | null;
  line_message_id: string | null;
  message_type: string;
  content: Record<string, unknown>;
  is_internal_note: boolean;
  is_unsent: boolean;
  unsent_at: Date | null;
  quoted_message_id: string | null;
  sent_at: Date;
};

export type MessageWithQuote = MessageRow & {
  quoted_preview: string | null;
  quoted_direction: "inbound" | "outbound" | "system" | null;
  quoted_message_type: string | null;
  quoted_content: Record<string, unknown> | null;
};

export async function getOrCreateConversation(
  customerId: string,
): Promise<ConversationRow> {
  const row = await queryOne<ConversationRow>(
    `INSERT INTO sena_ev.conversations (customer_id, status)
     VALUES ($1, 'open')
     ON CONFLICT (customer_id) DO UPDATE SET updated_at = now()
     RETURNING id, customer_id, status, last_message_at,
               last_message_preview, last_message_type, unread_count`,
    [customerId],
  );
  if (!row) throw new Error("getOrCreateConversation: no row");
  return row;
}

export async function saveInboundMessage(params: {
  conversationId: string;
  lineMessageId: string | null;
  replyToken: string | null;
  quoteToken: string | null;
  quotedLineMessageId: string | null;
  messageType: string;
  content: Record<string, unknown>;
  rawPayload: Record<string, unknown>;
  preview: string;
}): Promise<{ id: string } | null> {
  return withTransaction(async (client) => {
    if (params.lineMessageId) {
      const existing = await client.query<{ id: string }>(
        `SELECT id FROM sena_ev.messages WHERE line_message_id = $1`,
        [params.lineMessageId],
      );
      if (existing.rows.length > 0) return existing.rows[0]!;
    }
    let quotedId: string | null = null;
    if (params.quotedLineMessageId) {
      const found = await client.query<{ id: string }>(
        `SELECT id FROM sena_ev.messages WHERE line_message_id = $1`,
        [params.quotedLineMessageId],
      );
      quotedId = found.rows[0]?.id ?? null;
    }
    const inserted = await client.query<{ id: string }>(
      `INSERT INTO sena_ev.messages
         (conversation_id, direction, line_message_id, reply_token,
          quote_token, quoted_message_id, message_type, content, raw_payload)
       VALUES ($1, 'inbound', $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb)
       RETURNING id`,
      [
        params.conversationId,
        params.lineMessageId,
        params.replyToken,
        params.quoteToken,
        quotedId,
        params.messageType,
        JSON.stringify(params.content),
        JSON.stringify(params.rawPayload),
      ],
    );
    await client.query(
      `UPDATE sena_ev.conversations
       SET last_message_at      = now(),
           last_message_preview = $2,
           last_message_type    = $3,
           unread_count         = unread_count + 1,
           status               = CASE WHEN status = 'closed' THEN 'open' ELSE status END
       WHERE id = $1`,
      [params.conversationId, params.preview, params.messageType],
    );
    return inserted.rows[0]!;
  });
}

export async function saveOutboundMessage(params: {
  conversationId: string;
  agentId: string | null;
  messageType: string;
  content: Record<string, unknown>;
  isInternalNote?: boolean;
  preview: string;
  quotedMessageId?: string | null;
  lineMessageId?: string | null;
}): Promise<{ id: string }> {
  return withTransaction(async (client) => {
    const inserted = await client.query<{ id: string }>(
      `INSERT INTO sena_ev.messages
         (conversation_id, direction, agent_id, line_message_id,
          quoted_message_id, message_type, content, is_internal_note)
       VALUES ($1, 'outbound', $2, $3, $4, $5, $6::jsonb, $7)
       RETURNING id`,
      [
        params.conversationId,
        params.agentId,
        params.lineMessageId ?? null,
        params.quotedMessageId ?? null,
        params.messageType,
        JSON.stringify(params.content),
        params.isInternalNote ?? false,
      ],
    );
    if (!params.isInternalNote) {
      await client.query(
        `UPDATE sena_ev.conversations
         SET last_message_at      = now(),
             last_message_preview = $2,
             last_message_type    = $3
         WHERE id = $1`,
        [params.conversationId, params.preview, params.messageType],
      );
    }
    return inserted.rows[0]!;
  });
}

export async function listConversations(): Promise<ConversationListItem[]> {
  const result = await query<ConversationListItem>(
    `SELECT c.id, c.customer_id, c.status, c.last_message_at,
            c.last_message_preview, c.last_message_type, c.unread_count,
            cust.line_user_id   AS customer_line_user_id,
            cust.display_name   AS customer_display_name,
            cust.picture_url    AS customer_picture_url,
            cust.state          AS customer_state
     FROM sena_ev.conversations c
     JOIN sena_ev.customers cust ON cust.id = c.customer_id
     ORDER BY c.last_message_at DESC NULLS LAST, c.created_at DESC
     LIMIT 200`,
  );
  return result.rows;
}

export async function getConversationDetail(conversationId: string) {
  const conversation = await queryOne<ConversationListItem>(
    `SELECT c.id, c.customer_id, c.status, c.last_message_at,
            c.last_message_preview, c.last_message_type, c.unread_count,
            cust.line_user_id   AS customer_line_user_id,
            cust.display_name   AS customer_display_name,
            cust.picture_url    AS customer_picture_url,
            cust.state          AS customer_state
     FROM sena_ev.conversations c
     JOIN sena_ev.customers cust ON cust.id = c.customer_id
     WHERE c.id = $1`,
    [conversationId],
  );
  if (!conversation) return null;

  const messages = await query<MessageWithQuote>(
    `SELECT m.id, m.conversation_id, m.direction, m.agent_id, m.line_message_id,
            m.message_type, m.content, m.is_internal_note, m.is_unsent, m.unsent_at,
            m.quoted_message_id, m.sent_at,
            CASE
              WHEN q.content->>'text' IS NOT NULL THEN q.content->>'text'
              WHEN q.message_type IS NOT NULL    THEN '[' || q.message_type || ']'
              ELSE NULL
            END                AS quoted_preview,
            q.direction        AS quoted_direction,
            q.message_type     AS quoted_message_type,
            q.content          AS quoted_content
     FROM sena_ev.messages m
     LEFT JOIN sena_ev.messages q ON q.id = m.quoted_message_id
     WHERE m.conversation_id = $1
     ORDER BY m.sent_at ASC
     LIMIT 500`,
    [conversationId],
  );

  return { conversation, messages: messages.rows };
}

export async function markMessageUnsentByLineId(
  lineMessageId: string,
): Promise<{ id: string; conversation_id: string } | null> {
  return queryOne<{ id: string; conversation_id: string }>(
    `UPDATE sena_ev.messages
     SET is_unsent = true, unsent_at = now()
     WHERE line_message_id = $1
     RETURNING id, conversation_id`,
    [lineMessageId],
  );
}

export async function getQuoteTokenForMessage(
  messageId: string,
): Promise<string | null> {
  const row = await queryOne<{ quote_token: string }>(
    `SELECT quote_token FROM sena_ev.messages
     WHERE id = $1 AND quote_token IS NOT NULL`,
    [messageId],
  );
  return row?.quote_token ?? null;
}

export async function markConversationRead(
  conversationId: string,
): Promise<void> {
  await query(
    `UPDATE sena_ev.conversations SET unread_count = 0 WHERE id = $1`,
    [conversationId],
  );
}

const REPLY_WINDOW_SECONDS = 30;

export async function findUsableReplyToken(
  conversationId: string,
): Promise<string | null> {
  const row = await queryOne<{ reply_token: string }>(
    `SELECT reply_token FROM sena_ev.messages
     WHERE conversation_id = $1
       AND direction = 'inbound'
       AND reply_token IS NOT NULL
       AND reply_token_used_at IS NULL
       AND sent_at > now() - ($2 || ' seconds')::interval
     ORDER BY sent_at DESC LIMIT 1`,
    [conversationId, String(REPLY_WINDOW_SECONDS)],
  );
  return row?.reply_token ?? null;
}

export async function markReplyTokenUsed(replyToken: string): Promise<void> {
  await query(
    `UPDATE sena_ev.messages
     SET reply_token_used_at = now()
     WHERE reply_token = $1 AND reply_token_used_at IS NULL`,
    [replyToken],
  );
}
