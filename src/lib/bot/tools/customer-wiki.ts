import "server-only";
import type { CustomerWikiKind } from "../types";
import { upsert as upsertPage } from "../wiki/customer";
import type { ToolContext } from "./index";

const VALID_KINDS: CustomerWikiKind[] = [
  "profile",
  "preference",
  "observation",
  "decision",
  "todo",
  "note",
];

/**
 * Bot-callable tool: save a fact about THIS customer into their
 * customer_wiki_pages. Slug acts as the upsert key — re-using the
 * same slug overwrites the prior note.
 */
export async function rememberCustomerFact(
  args: {
    slug?: string;
    title?: string;
    kind?: string;
    body?: string;
    importance?: number;
  },
  ctx: ToolContext,
): Promise<unknown> {
  const slug = (args.slug ?? "").trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-");
  const title = (args.title ?? "").trim();
  const kind = (args.kind ?? "").trim() as CustomerWikiKind;
  const body = (args.body ?? "").trim();

  if (!slug) return { error: "ต้องระบุ slug (snake-case ตัวอักษรอังกฤษ)" };
  if (!title) return { error: "ต้องระบุ title" };
  if (!body) return { error: "ต้องระบุ body" };
  if (!VALID_KINDS.includes(kind)) {
    return { error: `kind ต้องเป็นหนึ่งใน: ${VALID_KINDS.join(", ")}` };
  }

  const page = await upsertPage({
    customerId: ctx.customerId,
    slug,
    title,
    kind,
    bodyMd: body,
    importance: args.importance ?? 2,
    source: "bot",
  });
  return {
    ok: true,
    slug: page.slug,
    title: page.title,
    kind: page.kind,
  };
}
