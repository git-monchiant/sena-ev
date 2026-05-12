import "server-only";
import { queryOne } from "../../db";
import type { BotContext } from "../types";
import { renderCustomerBlock } from "./customer-block";
import { renderSharedWikiBlock } from "./shared-block";
import { get as getSummary } from "./summary";
import { loadTranscript, renderTranscript } from "./transcript";

/**
 * Assemble everything the bot needs to know about a conversation
 * into one markdown context block + a structured transcript.
 *
 * Read-only — does not mutate.
 */
export async function assembleBotContext(
  conversationId: string,
  opts: { transcriptLimit?: number } = {},
): Promise<BotContext | null> {
  const conv = await queryOne<{ customer_id: string }>(
    `SELECT customer_id FROM sena_ev.conversations WHERE id = $1`,
    [conversationId],
  );
  if (!conv) return null;

  const [customerBlock, sharedBlock, summary] = await Promise.all([
    renderCustomerBlock(conv.customer_id),
    renderSharedWikiBlock(),
    getSummary(conversationId),
  ]);
  // Load transcript AFTER the summary so we can skip messages that are
  // already represented by the rolling summary.
  const transcript = await loadTranscript(
    conversationId,
    opts.transcriptLimit ?? 30,
    summary?.throughSentAt ?? null,
  );

  const sections: string[] = [];
  sections.push("# ข้อมูลผลิตภัณฑ์ / โชว์รูม / โปรโมชั่น (shared wiki)");
  sections.push(sharedBlock);
  sections.push("");
  sections.push(customerBlock);
  if (summary?.summaryMd?.trim()) {
    sections.push("");
    sections.push("## บทสนทนาก่อนหน้า (สรุป)");
    sections.push(summary.summaryMd.trim());
  }
  sections.push("");
  sections.push("## บทสนทนาล่าสุด");
  sections.push(renderTranscript(transcript));

  return {
    conversationId,
    customerId: conv.customer_id,
    contextMd: sections.join("\n"),
    transcript,
  };
}
