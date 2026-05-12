import "server-only";
import { query } from "../../db";
import type { ToolContext } from "./index";

/**
 * Bot-callable: update the phone number stored on this customer row.
 * Used during the "ทีมงานจะติดต่อกลับ" handoff so the bot can collect /
 * correct a callback number when the customer offers a new one.
 *
 * The bot owns the conversational phrasing — this tool just persists.
 */
export async function updateCustomerPhone(
  args: { phone?: string },
  ctx: ToolContext,
): Promise<unknown> {
  const raw = (args.phone ?? "").replace(/[\s-]+/g, "");
  if (!/^0\d{8,9}$/.test(raw)) {
    return { error: "เบอร์โทรไม่ถูกต้อง — ต้องขึ้นต้น 0 และมี 9-10 หลัก" };
  }
  await query(
    `UPDATE sena_ev.customers
        SET phone = $1, updated_at = now()
      WHERE id = $2`,
    [raw, ctx.customerId],
  );
  return { ok: true, phone: raw };
}
