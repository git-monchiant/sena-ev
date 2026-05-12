import "server-only";
import type { FunctionDeclaration } from "@google/genai";

import { calculateFinancing } from "./financing";
import { escalate } from "./escalate";
import { listActivePromotions, lookupCarModel, listCarModels } from "./cars";
import { lookupShowroom, listShowrooms } from "./showrooms";
import { searchWiki } from "./wiki-search";
import { sendMaterial } from "./send-material";

export type ToolContext = {
  conversationId: string;
  customerId: string;
  lineUserId: string | null;
};

export type ToolHandler = (
  args: Record<string, unknown>,
  ctx: ToolContext,
) => Promise<unknown>;

export type ToolDef = {
  decl: FunctionDeclaration;
  handler: ToolHandler;
};

const t = (decl: FunctionDeclaration, handler: ToolHandler): ToolDef => ({
  decl,
  handler,
});

export const TOOLS: Record<string, ToolDef> = {
  lookup_car_model: t(
    {
      name: "lookup_car_model",
      description:
        "ดูข้อมูลรถ EV ที่ Sena EV ขาย รุ่นเดียว: ราคา, สเปค, brochure URL. ใช้ตอนลูกค้าถามถึงรุ่นใดรุ่นหนึ่ง.",
      parametersJsonSchema: {
        type: "object",
        properties: {
          slug: {
            type: "string",
            description: "slug เช่น 'jaecoo-j7' หรือ 'deepal-s07'",
          },
        },
        required: ["slug"],
      },
    },
    (args) => lookupCarModel(args.slug as string),
  ),
  list_car_models: t(
    {
      name: "list_car_models",
      description:
        "ดูรายการรุ่นรถ EV ที่ Sena EV ขายทั้งหมด พร้อมราคา + ระยะวิ่ง. ใช้ตอนลูกค้าถามภาพรวม หรือเทียบราคา.",
      parametersJsonSchema: {
        type: "object",
        properties: {
          brand: { type: "string", description: "filter by brand เช่น JAECOO" },
          price_max: {
            type: "number",
            description: "ราคาสูงสุด (บาท)",
          },
        },
      },
    },
    (args) =>
      listCarModels({
        brand: args.brand as string | undefined,
        priceMax: args.price_max as number | undefined,
      }),
  ),
  lookup_showroom: t(
    {
      name: "lookup_showroom",
      description:
        "ดูข้อมูลโชว์รูม Sena EV สาขาเดียว: ที่อยู่, เวลาเปิด, เบอร์โทร, link Google Maps.",
      parametersJsonSchema: {
        type: "object",
        properties: {
          slug: {
            type: "string",
            description: "slug เช่น 'bangna', 'ratchayothin', 'bangyai'",
          },
        },
        required: ["slug"],
      },
    },
    (args) => lookupShowroom(args.slug as string),
  ),
  list_showrooms: t(
    {
      name: "list_showrooms",
      description: "ดูรายการโชว์รูม Sena EV ทุกสาขา.",
      parametersJsonSchema: { type: "object", properties: {} },
    },
    () => listShowrooms(),
  ),
  list_active_promotions: t(
    {
      name: "list_active_promotions",
      description:
        "ดูโปรโมชั่นปัจจุบันที่ยังใช้ได้. optional filter ตามรุ่นรถ.",
      parametersJsonSchema: {
        type: "object",
        properties: {
          model_slug: {
            type: "string",
            description: "ถ้าระบุ → คืนเฉพาะโปรที่ใช้ได้กับรุ่นนี้",
          },
        },
      },
    },
    (args) => listActivePromotions(args.model_slug as string | undefined),
  ),
  search_wiki: t(
    {
      name: "search_wiki",
      description:
        "ค้นหาในคลังความรู้ Sena EV (FAQ, policy, รุ่นรถ, โปร, โชว์รูม) ด้วย keyword หรือ phrase ภาษาไทย/อังกฤษ.",
      parametersJsonSchema: {
        type: "object",
        properties: {
          query: { type: "string", description: "คำค้นหา" },
          limit: { type: "number", description: "default 5" },
        },
        required: ["query"],
      },
    },
    (args) =>
      searchWiki(args.query as string, (args.limit as number) ?? 5),
  ),
  calculate_financing: t(
    {
      name: "calculate_financing",
      description:
        "คำนวณค่างวด สินเชื่อรถ: ใส่ราคา, ดาวน์ %, จำนวนงวด, ดอกเบี้ย/ปี → คืนค่างวด/เดือน + รวมดอกเบี้ย.",
      parametersJsonSchema: {
        type: "object",
        properties: {
          price_baht: { type: "number" },
          down_percent: { type: "number", description: "default 20" },
          months: { type: "number", description: "default 60" },
          interest_rate_pct: {
            type: "number",
            description: "ดอกเบี้ย/ปี (เช่น 3.5)",
          },
        },
        required: ["price_baht", "interest_rate_pct"],
      },
    },
    async (args) =>
      calculateFinancing({
        priceBaht: args.price_baht as number,
        downPercent: (args.down_percent as number) ?? 20,
        months: (args.months as number) ?? 60,
        interestRatePct: args.interest_rate_pct as number,
      }),
  ),
  send_material: t(
    {
      name: "send_material",
      description:
        "ส่ง Flex card / material ให้ลูกค้าใน LINE chat. ใช้ตอนลูกค้าขอรายละเอียดเชิงลึก เช่น brochure รุ่นรถ, การ์ดโชว์รูม, การ์ดโปร.",
      parametersJsonSchema: {
        type: "object",
        properties: {
          slug: {
            type: "string",
            description:
              "slug จาก shared wiki เช่น 'car-jaecoo-j7', 'showroom-bangna', 'promo-rate-199-48m'",
          },
        },
        required: ["slug"],
      },
    },
    (args, ctx) => sendMaterial(args.slug as string, ctx),
  ),
  escalate: t(
    {
      name: "escalate",
      description:
        "เรียกหา agent คนจริง. ใช้เมื่อ: ลูกค้าขอ refund/complain/legal/ต่อรองราคา หรือ bot ไม่มั่นใจ. จะตอบลูกค้าด้วยข้อความรอ agent.",
      parametersJsonSchema: {
        type: "object",
        properties: {
          reason: {
            type: "string",
            description:
              "หมวด: refund | complaint | legal | negotiation | angry | unsure | other",
          },
          note: { type: "string", description: "รายละเอียดสั้นๆ" },
        },
        required: ["reason"],
      },
    },
    (args, ctx) =>
      escalate(
        {
          reason: args.reason as string,
          note: (args.note as string | undefined) ?? null,
        },
        ctx,
      ),
  ),
};

export function getFunctionDeclarations(): FunctionDeclaration[] {
  return Object.values(TOOLS).map((t) => t.decl);
}

export async function runTool(
  name: string,
  args: Record<string, unknown>,
  ctx: ToolContext,
): Promise<unknown> {
  const tool = TOOLS[name];
  if (!tool) {
    return { error: `unknown tool: ${name}` };
  }
  try {
    return await tool.handler(args, ctx);
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "tool execution failed",
    };
  }
}
