import "server-only";
import { query, queryOne } from "../../db";

type Row = {
  conversation_id: string;
  summary_md: string;
  through_message_id: string | null;
  through_sent_at: string | null;
  token_count: number | null;
  updated_at: string;
};

export type ConversationSummary = {
  conversationId: string;
  summaryMd: string;
  throughMessageId: string | null;
  throughSentAt: string | null;
  tokenCount: number | null;
  updatedAt: string;
};

function toSummary(r: Row): ConversationSummary {
  return {
    conversationId: r.conversation_id,
    summaryMd: r.summary_md,
    throughMessageId: r.through_message_id,
    throughSentAt: r.through_sent_at,
    tokenCount: r.token_count,
    updatedAt: r.updated_at,
  };
}

export async function get(
  conversationId: string,
): Promise<ConversationSummary | null> {
  const r = await queryOne<Row>(
    `SELECT conversation_id, summary_md, through_message_id,
            through_sent_at::text, token_count, updated_at::text
       FROM sena_ev.bot_conversation_summaries
      WHERE conversation_id = $1`,
    [conversationId],
  );
  return r ? toSummary(r) : null;
}

export async function upsert(params: {
  conversationId: string;
  summaryMd: string;
  throughMessageId: string | null;
  throughSentAt: string | null;
  tokenCount?: number;
}): Promise<void> {
  await query(
    `INSERT INTO sena_ev.bot_conversation_summaries
       (conversation_id, summary_md, through_message_id, through_sent_at, token_count, updated_at)
     VALUES ($1, $2, $3, $4, $5, now())
     ON CONFLICT (conversation_id) DO UPDATE SET
       summary_md         = EXCLUDED.summary_md,
       through_message_id = EXCLUDED.through_message_id,
       through_sent_at    = EXCLUDED.through_sent_at,
       token_count        = EXCLUDED.token_count,
       updated_at         = now()`,
    [
      params.conversationId,
      params.summaryMd,
      params.throughMessageId,
      params.throughSentAt,
      params.tokenCount ?? null,
    ],
  );
}

export async function remove(conversationId: string): Promise<void> {
  await query(
    `DELETE FROM sena_ev.bot_conversation_summaries WHERE conversation_id = $1`,
    [conversationId],
  );
}
