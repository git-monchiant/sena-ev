import "server-only";

/**
 * Rule-based pre-classifier. Returns a reason if the message should
 * skip the bot entirely and go straight to a human. Returns null if
 * bot can handle it.
 *
 * The bot itself also has an `escalate` tool for LLM-driven escalation —
 * this is just a fast pre-filter for obvious cases.
 */
export function classifyEscalation(text: string): {
  reason: string;
  matched: string;
} | null {
  const t = text.toLowerCase();
  for (const { rx, reason } of RULES) {
    const m = rx.exec(t);
    if (m) return { reason, matched: m[0] };
  }
  return null;
}

type Rule = { rx: RegExp; reason: string };

const RULES: Rule[] = [
  // Refund / money-back
  {
    rx: /(refund|คืนเงิน|ขอเงินคืน|ขอคืน|ทวงเงินคืน)/i,
    reason: "refund",
  },
  // Complaints
  {
    rx: /(ร้องเรียน|complain|complaint|คอมเพลน|แย่มาก|บริการห่วย|พนักงานหยาบ|ไม่พอใจ)/i,
    reason: "complaint",
  },
  // Legal / contract / warranty disputes
  {
    rx: /(ฟ้อง|ทนาย|สคบ\.?|กฎหมาย|legal|ละเมิดสัญญา|breach)/i,
    reason: "legal",
  },
  // Talk to manager / human / supervisor
  {
    rx: /(ขอคุยกับ.{0,8}(ผู้จัดการ|หัวหน้า|manager|supervisor|คนจริง)|ขอ.{0,4}คน(จริง|พิมพ์))/i,
    reason: "talk_to_human",
  },
  // Sentiment: anger / strong
  {
    rx: /(โกรธ|โมโห|เซ็ง|ห่วย|fxxk|f\*\*\*|งี่เง่า|ไอ้.{1,4}|แย่ที่สุด)/i,
    reason: "angry",
  },
  // Negotiation / discount asks
  {
    rx: /(ลดราคา|ลดเพิ่ม|ต่อรอง|ลด.{0,5}บาท|ลดอีก|negotiate)/i,
    reason: "negotiation",
  },
];
