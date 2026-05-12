import "server-only";
import { query, queryOne } from "../../db";
import { getActivePolicy, getPrimaryVehicle } from "../../vehicles";
import { listByCustomer as listCustomerWiki } from "../wiki/customer";

type CustomerRow = {
  id: string;
  line_user_id: string;
  display_name: string | null;
  state: string;
  phone: string | null;
  email: string | null;
  followed_at: string | null;
};

type ScheduleRow = {
  id: string;
  type: string;
  subtype: string | null;
  title: string;
  scheduled_at: string;
  location: string | null;
  status: string;
};

type TagRow = { name: string; category: string };

type LeadRow = { type: string; status: string; created_at: string };

/**
 * Render the customer's right-panel data into a compact markdown block
 * suitable for inclusion in the bot prompt.
 */
export async function renderCustomerBlock(
  customerId: string,
): Promise<string> {
  const [customer, vehicle, openSchedules, tags, recentLeads, wikiPages] =
    await Promise.all([
      queryOne<CustomerRow>(
        `SELECT id, line_user_id, display_name, state, phone, email,
                followed_at::text
           FROM sena_ev.customers WHERE id = $1`,
        [customerId],
      ),
      getPrimaryVehicle(customerId),
      query<ScheduleRow>(
        `SELECT id, type, subtype, title, scheduled_at::text,
                location, status
           FROM sena_ev.schedules
          WHERE customer_id = $1
            AND status IN ('NEW','CONFIRMED','IN_PROGRESS')
          ORDER BY scheduled_at ASC
          LIMIT 5`,
        [customerId],
      ),
      query<TagRow>(
        `SELECT t.name, t.category
           FROM sena_ev.customer_tags ct
           JOIN sena_ev.tags t ON t.id = ct.tag_id
          WHERE ct.customer_id = $1`,
        [customerId],
      ),
      query<LeadRow>(
        `SELECT type, status, created_at::text
           FROM sena_ev.leads
          WHERE customer_id = $1
          ORDER BY created_at DESC LIMIT 5`,
        [customerId],
      ),
      listCustomerWiki(customerId, { minImportance: 2 }),
    ]);

  if (!customer) return "(ลูกค้าไม่พบในระบบ)";

  const policy = vehicle ? await getActivePolicy(vehicle.id) : null;
  const lines: string[] = [];

  lines.push(`## ลูกค้า`);
  lines.push(`- ชื่อ: ${customer.display_name ?? "(ไม่ระบุ)"}`);
  lines.push(`- สถานะ: ${customer.state}`);
  if (customer.phone) lines.push(`- เบอร์: ${customer.phone}`);
  if (customer.email) lines.push(`- อีเมล: ${customer.email}`);
  if (customer.followed_at) {
    lines.push(`- แอด OA เมื่อ: ${customer.followed_at.slice(0, 10)}`);
  }

  if (tags.rows.length > 0) {
    lines.push("");
    lines.push(`## tags`);
    for (const t of tags.rows) {
      lines.push(`- ${t.name} (${t.category})`);
    }
  }

  if (vehicle) {
    lines.push("");
    lines.push(`## รถ`);
    const m = [vehicle.modelBrand, vehicle.modelName].filter(Boolean).join(" ");
    lines.push(`- ${m || "(ไม่ระบุรุ่น)"} · สี ${vehicle.color ?? "—"}`);
    if (vehicle.licensePlate)
      lines.push(`- ทะเบียน: ${vehicle.licensePlate}`);
    if (vehicle.currentMileageKm != null)
      lines.push(`- เลขไมล์: ${vehicle.currentMileageKm.toLocaleString()} km`);
    if (vehicle.warrantyUntil)
      lines.push(`- รับประกันถึง: ${vehicle.warrantyUntil}`);
    if (vehicle.modelBatteryKwh)
      lines.push(`- แบต: ${vehicle.modelBatteryKwh} kWh`);
    if (policy) {
      lines.push(
        `- ประกัน: ${policy.provider} ชั้น ${policy.class}${
          policy.validTo ? ` (ถึง ${policy.validTo})` : ""
        }`,
      );
    }
  }

  if (openSchedules.rows.length > 0) {
    lines.push("");
    lines.push(`## นัดที่ยังเปิดอยู่`);
    for (const s of openSchedules.rows) {
      const t = new Date(s.scheduled_at).toLocaleString("th-TH", {
        timeZone: "Asia/Bangkok",
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
      lines.push(
        `- ${s.title}${s.subtype ? ` (${s.subtype})` : ""} — ${t} @ ${s.location ?? "—"} [${s.status}]`,
      );
    }
  }

  if (recentLeads.rows.length > 0) {
    lines.push("");
    lines.push(`## leads ล่าสุด`);
    for (const l of recentLeads.rows) {
      lines.push(`- ${l.type} (${l.status}) — ${l.created_at.slice(0, 10)}`);
    }
  }

  if (wikiPages.length > 0) {
    lines.push("");
    lines.push(`## บันทึก/ความชอบ (customer wiki)`);
    for (const p of wikiPages) {
      lines.push(`### ${p.title} (${p.kind})`);
      lines.push(p.bodyMd.trim());
      lines.push("");
    }
  }

  return lines.join("\n");
}
