import "server-only";

/* ─────────── Wiki primitives ─────────── */

export type WikiKind =
  | "product"
  | "policy"
  | "faq"
  | "process"
  | "brand"
  | "note";

export type CustomerWikiKind =
  | "profile"
  | "preference"
  | "observation"
  | "interaction-summary"
  | "decision"
  | "todo"
  | "note";

export type EdgeRelation =
  | "interested_in"
  | "owns"
  | "has_tag"
  | "about"
  | "led_to"
  | "mentioned"
  | "related_to"
  | "replaces"
  | "inspired_by";

export type NodeKind =
  | "wiki_page"
  | "customer_wiki_page"
  | "customer"
  | "vehicle"
  | "car_model"
  | "showroom"
  | "promotion"
  | "lead"
  | "schedule"
  | "tag"
  | "message";

export type WikiPage = {
  id: string;
  slug: string;
  title: string;
  kind: WikiKind;
  bodyMd: string;
  tags: string[];
  aliases: string[];
  refTable: string | null;
  refId: string | null;
  isPublished: boolean;
  updatedAt: string;
};

export type CustomerWikiPage = {
  id: string;
  customerId: string;
  slug: string;
  title: string;
  kind: CustomerWikiKind;
  bodyMd: string;
  aliases: string[];
  importance: number;
  source: string | null;
  sourceMessageId: string | null;
  updatedAt: string;
};

export type WikiEdge = {
  id: string;
  fromKind: NodeKind;
  fromId: string;
  toKind: NodeKind;
  toId: string;
  relation: EdgeRelation;
  weight: number;
  note: string | null;
  source: string | null;
};

/* ─────────── Assembled context for the bot ─────────── */

export type BotTranscriptTurn = {
  role: "user" | "assistant" | "system";
  text: string;
  sentAt: string;
};

export type BotContext = {
  conversationId: string;
  customerId: string;
  /**
   * Markdown ready to be inserted into the bot prompt.
   * Composition:
   *   ## Customer
   *   <customer block>
   *
   *   ## Open schedules
   *   ...
   *
   *   ## Customer notes (wiki)
   *   ...
   *
   *   ## Conversation summary (prior)
   *   ...
   */
  contextMd: string;
  /** Last N message turns, ordered oldest-first. */
  transcript: BotTranscriptTurn[];
};
