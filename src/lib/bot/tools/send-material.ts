import "server-only";
import { getCustomerByLineUserId } from "../../customer-state";
import { query, queryOne } from "../../db";
import { getMessagingClient } from "../../line/client";
import {
  getOrCreateConversation,
  saveOutboundMessage,
} from "../../conversations";
import {
  buildMaterialFlex,
  type MaterialFlexInput,
} from "../materials";
import type { ToolContext } from "./index";

/**
 * Resolve a material slug → build Flex → push to LINE → save outbound
 * message. Returns { ok, slug, title }.
 *
 * The slug must reference a sena_ev.wiki_pages row that has a backing
 * ref_table (car_models | showrooms | promotions).
 */
export async function sendMaterial(
  slug: string,
  ctx: ToolContext,
): Promise<unknown> {
  const page = await queryOne<{
    id: string;
    slug: string;
    title: string;
    kind: string;
    body_md: string;
    ref_table: string | null;
    ref_id: string | null;
  }>(
    `SELECT id, slug, title, kind, body_md, ref_table, ref_id
       FROM sena_ev.wiki_pages
      WHERE slug = $1 AND is_published = true`,
    [slug],
  );
  if (!page) return { error: `ไม่พบ wiki page slug="${slug}"` };

  // Resolve target lineUserId
  let lineUserId = ctx.lineUserId;
  if (!lineUserId) {
    const r = await queryOne<{ line_user_id: string }>(
      `SELECT line_user_id FROM sena_ev.customers WHERE id = $1`,
      [ctx.customerId],
    );
    lineUserId = r?.line_user_id ?? null;
  }
  if (!lineUserId) return { error: "ลูกค้าไม่มี lineUserId" };

  // Confirm we know which customer (defence in depth)
  const customer = await getCustomerByLineUserId(lineUserId);
  if (!customer || customer.id !== ctx.customerId) {
    return { error: "customer mismatch" };
  }

  // Build material input from ref_table/ref_id + wiki body fallback
  const input: MaterialFlexInput = {
    slug: page.slug,
    title: page.title,
    bodyMd: page.body_md,
    refTable: page.ref_table,
    refId: page.ref_id,
  };
  const built = await buildMaterialFlex(input);
  if (!built) return { error: `ไม่สามารถสร้าง material สำหรับ slug="${slug}"` };

  const client = getMessagingClient();
  const res = await client.pushMessage({
    to: lineUserId,
    messages: [built.flex],
  });

  // Save to admin inbox (FlexCardData-shape that existing renderer
  // understands)
  try {
    const conv = await getOrCreateConversation(ctx.customerId);
    await saveOutboundMessage({
      conversationId: conv.id,
      agentId: null,
      messageType: "flex",
      content: built.summary,
      preview: `[material] ${page.title}`,
      lineMessageId: res.sentMessages?.[0]?.id ?? null,
    });
  } catch (err) {
    console.error("[bot.send_material] save outbound failed", err);
  }

  return { ok: true, slug: page.slug, title: page.title };
}
