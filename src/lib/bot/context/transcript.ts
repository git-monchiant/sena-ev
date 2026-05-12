import "server-only";
import { query } from "../../db";
import type { BotTranscriptTurn } from "../types";

type Row = {
  direction: "inbound" | "outbound" | "system";
  message_type: string;
  content: Record<string, unknown>;
  is_internal_note: boolean;
  sent_at: string;
};

/**
 * Pull the last N non-internal messages from a conversation in
 * chronological (oldest-first) order, normalised to text turns.
 *
 * When `sinceSentAt` is provided, only messages strictly newer than
 * that timestamp are returned — used together with the rolling summary
 * so we don't double-render messages that are already summarised.
 */
export async function loadTranscript(
  conversationId: string,
  limit = 30,
  sinceSentAt: string | null = null,
): Promise<BotTranscriptTurn[]> {
  const params: unknown[] = [conversationId];
  const conds: string[] = [
    "conversation_id = $1",
    "is_internal_note = false",
  ];
  if (sinceSentAt) {
    params.push(sinceSentAt);
    conds.push(`sent_at > $${params.length}`);
  }
  params.push(limit);
  const r = await query<Row>(
    `SELECT direction, message_type, content, is_internal_note,
            sent_at::text
       FROM sena_ev.messages
      WHERE ${conds.join(" AND ")}
      ORDER BY sent_at DESC
      LIMIT $${params.length}`,
    params,
  );
  return r.rows
    .reverse()
    .map<BotTranscriptTurn>((m) => ({
      role:
        m.direction === "inbound"
          ? "user"
          : m.direction === "outbound"
            ? "assistant"
            : "system",
      text: extractText(m.message_type, m.content),
      sentAt: m.sent_at,
    }));
}

function extractText(
  messageType: string,
  content: Record<string, unknown>,
): string {
  if (messageType === "text") return (content.text as string) ?? "";
  if (messageType === "image") return "[image]";
  if (messageType === "video") return "[video]";
  if (messageType === "audio") return "[audio]";
  if (messageType === "sticker") return "[sticker]";
  if (messageType === "location") {
    const title = (content.title as string) ?? "ตำแหน่ง";
    return `[location] ${title}`;
  }
  if (messageType === "flex") {
    const title = (content.title as string) ?? "";
    return `[flex] ${title}`.trim();
  }
  return `[${messageType}]`;
}

/**
 * Render the transcript as a markdown block for inclusion in a prompt.
 */
export function renderTranscript(turns: BotTranscriptTurn[]): string {
  if (turns.length === 0) return "(ยังไม่มีบทสนทนา)";
  return turns
    .map((t) => {
      const who =
        t.role === "user"
          ? "ลูกค้า"
          : t.role === "assistant"
            ? "เรา"
            : "ระบบ";
      const ts = new Date(t.sentAt).toLocaleString("th-TH", {
        timeZone: "Asia/Bangkok",
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
      return `- [${ts}] ${who}: ${t.text}`;
    })
    .join("\n");
}
