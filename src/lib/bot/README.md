# Bot — Sena EV

All bot logic lives in `src/lib/bot/`. Nothing in this folder should
leak into other parts of the codebase except by explicit `import` from
its top-level entry points.

## Goals (v1, "Recommended" memory level)

1. Bot answers customer questions like a human.
2. Bot can send materials (Flex cards, brochures).
3. Bot does **NOT** create or mutate data (no auto-booking, no profile
   edits). Customers self-serve actions via LIFF.
4. Bot escalates to a human agent for: complaint, refund, legal,
   negotiation, sentiment=angry, low confidence.

## Memory model (wiki graph)

Three layers of memory, queried fresh each invocation:

### 1. Shared wiki — `sena_ev.wiki_pages`
Free-form markdown pages for brand voice, FAQ, policies, service
intervals. Optional back-link to a structured row via `(ref_table,
ref_id)`. Example pages: `car-jaecoo-j7`, `policy-trade-in`,
`faq-warranty`.

### 2. Customer wiki — `sena_ev.customer_wiki_pages`
Per-customer free-form notes: preferences, observations, decisions,
agent notes, todos. One root `profile` page per customer + ad-hoc.

### 3. Graph edges — `sena_ev.wiki_edges`
Typed relationships between any node:
- `customer:X --interested_in--> car_model:jaecoo-j7`
- `customer:X --owns--> vehicle:Y`
- `wiki_page:A --related_to--> wiki_page:B`

Structured tables (`vehicles`, `schedules`, `leads`, `tags`, `customers`,
`car_models`, `showrooms`, `promotions`, `insurance_policies`) remain
the source of truth — rendered to markdown on demand. They are NOT
duplicated as wiki pages.

### 4. Rolling summary — `sena_ev.bot_conversation_summaries`
When a conversation has more messages than the front-load window
(30 by default), older messages are compressed into a single summary
page. Updated by a background job after every N inbound messages or
on conversation close.

## Folder layout

```
src/lib/bot/
├── README.md             # this file
├── types.ts              # shared types (BotContext, WikiNode, etc.)
├── wiki/
│   ├── shared.ts         # CRUD for wiki_pages
│   ├── customer.ts       # CRUD for customer_wiki_pages
│   └── edges.ts          # CRUD for wiki_edges
├── context/
│   ├── assemble.ts       # assembleBotContext(conversationId)
│   ├── customer-block.ts # render customer panel as markdown
│   ├── transcript.ts     # render last N messages
│   └── summary.ts        # rolling summary helpers
├── prompt.ts             # system prompt + style examples
├── seed.ts               # auto-gen shared wiki pages from
│                         # car_models / showrooms / promotions
├── tools/                # (later) tool implementations
├── materials/            # (later) Flex card templates
├── escalation/           # (later) classify + notify
└── invoke.ts             # (later) main entry: handleInboundMessage
```

## Refresh strategy

| Data | Strategy | Trigger |
|---|---|---|
| Customer panel data | query fresh on each call | every call |
| Last 30 messages | query fresh on each call | every call |
| Rolling summary | regenerate when threshold crossed | background job |
| Shared wiki | cached in-process, invalidated on edit | edit |

## Conventions

- All public functions live in `src/lib/bot/<area>.ts` and are imported
  by their full path.
- No bot code outside this folder. API routes that need the bot live in
  `src/app/api/bot/*` and only `import` from `@/lib/bot/...`.
- Admin UI for inspecting memory lives in `src/app/admin/bot-memory/`
  (separate from the inbox UI).
- Database migrations for bot-related tables live in
  `sql/011_bot_memory.sql` (and future `01x_bot_*.sql`).
