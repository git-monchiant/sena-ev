import "server-only";
import { query, queryOne } from "../../db";
import { generate } from "../llm";
import { get as getSummary, upsert as upsertSummary } from "./summary";

/**
 * Tail size: messages always kept verbatim in the transcript section.
 * Anything older than this gets folded into the rolling summary.
 */
const TAIL_KEEP = 20;

/**
 * Don't re-run the LLM summariser unless this many new messages have
 * fallen out of the tail since the previous summary boundary.
 */
const MIN_NEW_TO_SUMMARIZE = 5;

const SUMMARY_SYSTEM = `\
คุณคือผู้ช่วยที่สรุปบทสนทนา sales ของ Sena EV เพื่อให้เซลส์ AI ตัวอื่นจำลูกค้าได้ข้ามวัน
สรุปสั้นๆ เน้นใจความสำคัญ:
- ลูกค้าเป็นใคร, สนใจรุ่นไหน, งบประมาณ, ความต้องการ
- ความกังวล/objection ที่เคยพูด
- ขั้นตอน/นัดหมายที่ตกลงแล้ว
- สิ่งที่เซลส์ promise ไว้ (จะส่งข้อมูล/ติดต่อกลับ/นัดทดลองขับ)
- สถานะปัจจุบันใน sales funnel

ใช้ภาษาไทย ตอบเป็น bullet สั้นๆ ไม่เกิน 200 คำ
ห้ามใช้ markdown formatting (** _ # -) — เขียนเป็น plain text + ขึ้นบรรทัดใหม่`;

type MsgRow = {
  id: string;
  direction: string;
  message_type: string;
  content: Record<string, unknown>;
  sent_at: string;
};

/**
 * Roll the per-conversation summary forward. Safe to call fire-and-forget
 * after every bot reply — it self-skips when there's not enough new work.
 *
 * Strategy:
 *  - Always keep the most recent TAIL_KEEP messages out of the summary
 *    (those are rendered verbatim by the transcript block).
 *  - Everything older gets folded into the rolling summary.
 *  - Only re-summarise when at least MIN_NEW_TO_SUMMARIZE new messages
 *    have moved out of the tail since the last summary.
 */
export async function maybeUpdateSummary(
  conversationId: string,
): Promise<{ updated: boolean; reason?: string }> {
  const existing = await getSummary(conversationId);

  const cnt = await queryOne<{ total: number }>(
    `SELECT COUNT(*)::int AS total
       FROM sena_ev.messages
      WHERE conversation_id = $1 AND is_internal_note = false`,
    [conversationId],
  );
  const total = cnt?.total ?? 0;
  if (total <= TAIL_KEEP) return { updated: false, reason: "too_short" };

  // Pull everything except the last TAIL_KEEP — these are the messages
  // that should be represented by the summary.
  const r = await query<MsgRow>(
    `SELECT id, direction, message_type, content, sent_at::text
       FROM sena_ev.messages
      WHERE conversation_id = $1 AND is_internal_note = false
      ORDER BY sent_at ASC, id ASC
      LIMIT $2`,
    [conversationId, total - TAIL_KEEP],
  );
  const toSummarize = r.rows;
  if (toSummarize.length === 0) return { updated: false, reason: "tail_only" };

  // If we already have a summary, skip unless enough new messages
  // have fallen out of the tail.
  if (existing?.throughMessageId) {
    const lastIdx = toSummarize.findIndex(
      (m) => m.id === existing.throughMessageId,
    );
    const newCount = toSummarize.length - 1 - lastIdx;
    if (lastIdx >= 0 && newCount < MIN_NEW_TO_SUMMARIZE) {
      return { updated: false, reason: "not_enough_new" };
    }
  }

  const transcript = toSummarize
    .map((m) => {
      const who =
        m.direction === "inbound"
          ? "ลูกค้า"
          : m.direction === "outbound"
            ? "เรา"
            : "ระบบ";
      const text = extractText(m.message_type, m.content);
      const t = new Date(m.sent_at).toLocaleString("th-TH", {
        timeZone: "Asia/Bangkok",
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
      return `[${t}] ${who}: ${text}`;
    })
    .join("\n");

  const userText = existing?.summaryMd
    ? `สรุปเดิม:\n${existing.summaryMd}\n\nข้อความใหม่ที่ยังไม่ได้สรุป:\n${transcript}\n\nอัพเดทสรุปใหม่ให้รวมข้อมูลทั้งหมด (เน้นเรื่องล่าสุดถ้าขัดกัน)`
    : `บทสนทนา:\n${transcript}\n\nสรุปใจความสำคัญ`;

  const { text } = await generate({
    systemInstruction: SUMMARY_SYSTEM,
    history: [],
    userText,
    temperature: 0.3,
  });

  const last = toSummarize[toSummarize.length - 1];
  await upsertSummary({
    conversationId,
    summaryMd: text.trim(),
    throughMessageId: last.id,
    throughSentAt: last.sent_at,
    tokenCount: Math.ceil(text.length / 4),
  });

  return { updated: true };
}

function extractText(
  messageType: string,
  content: Record<string, unknown>,
): string {
  if (messageType === "text") return (content.text as string) ?? "";
  if (messageType === "flex") {
    const title = (content.title as string) ?? "";
    return `[flex] ${title}`.trim();
  }
  if (messageType === "location") {
    return `[location] ${(content.title as string) ?? ""}`.trim();
  }
  if (messageType === "image") return "[image]";
  if (messageType === "video") return "[video]";
  if (messageType === "audio") return "[audio]";
  if (messageType === "sticker") return "[sticker]";
  return `[${messageType}]`;
}
