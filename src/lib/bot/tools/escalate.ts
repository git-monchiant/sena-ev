import "server-only";
import { query } from "../../db";
import type { ToolContext } from "./index";

/**
 * Flag a conversation as needing human handling. Records a system
 * message in the inbox so agent sees the escalation context.
 *
 * v1: just inserts a system message. Future: ping agent via webhook /
 * email / SSE.
 */
export async function escalate(
  params: { reason: string; note: string | null },
  ctx: ToolContext,
): Promise<unknown> {
  const reason = params.reason || "unsure";
  const note = params.note?.trim() || null;

  await query(
    `INSERT INTO sena_ev.messages
       (conversation_id, direction, message_type, content, is_internal_note, sent_at)
     VALUES ($1, 'system', 'escalation', $2::jsonb, true, now())`,
    [
      ctx.conversationId,
      JSON.stringify({
        reason,
        note,
        flagged_at: new Date().toISOString(),
      }),
    ],
  );

  await query(
    `UPDATE sena_ev.conversations
        SET status = 'pending', updated_at = now()
      WHERE id = $1`,
    [ctx.conversationId],
  );

  return { ok: true, escalated: true, reason };
}
