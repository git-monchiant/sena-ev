-- ====================================================
-- 011: Bot memory — wiki graph (shared + customer)
-- + rolling conversation summaries
-- All bot-related tables live in `sena_ev` schema but
-- are namespaced semantically under "wiki_*" / "bot_*".
-- ====================================================

CREATE OR REPLACE FUNCTION sena_ev.touch_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─────────────────────────────────────────────────
-- wiki_pages — shared knowledge (brand, products,
-- policies, FAQ). Free-form markdown. Optional
-- back-link via (ref_table, ref_id) to a structured row.
-- ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sena_ev.wiki_pages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          TEXT NOT NULL UNIQUE,
  title         TEXT NOT NULL,
  kind          TEXT NOT NULL,
    -- product | policy | faq | process | brand | note
  body_md       TEXT NOT NULL DEFAULT '',
  tags          TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ref_table     TEXT,
  ref_id        UUID,
  is_published  BOOLEAN NOT NULL DEFAULT true,
  updated_by_agent_id UUID,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_wiki_pages_kind
  ON sena_ev.wiki_pages (kind);
CREATE INDEX IF NOT EXISTS idx_wiki_pages_ref
  ON sena_ev.wiki_pages (ref_table, ref_id);
CREATE INDEX IF NOT EXISTS idx_wiki_pages_published
  ON sena_ev.wiki_pages (is_published) WHERE is_published = true;

-- ─────────────────────────────────────────────────
-- customer_wiki_pages — per-customer free-form notes
-- (preferences, observations, decisions, todos)
-- ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sena_ev.customer_wiki_pages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id   UUID NOT NULL REFERENCES sena_ev.customers(id) ON DELETE CASCADE,
  slug          TEXT NOT NULL,
  title         TEXT NOT NULL,
  kind          TEXT NOT NULL,
    -- profile | preference | observation | interaction-summary
    -- | decision | todo | note
  body_md       TEXT NOT NULL DEFAULT '',
  importance    SMALLINT NOT NULL DEFAULT 2,  -- 1=high 2=normal 3=archived
  source        TEXT,                          -- agent | bot | system
  source_message_id UUID REFERENCES sena_ev.messages(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (customer_id, slug)
);
CREATE INDEX IF NOT EXISTS idx_customer_wiki_customer
  ON sena_ev.customer_wiki_pages (customer_id, importance, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_customer_wiki_kind
  ON sena_ev.customer_wiki_pages (kind);

-- ─────────────────────────────────────────────────
-- wiki_edges — typed relationships between any
-- entities (wiki_pages, customer_wiki_pages,
-- customers, vehicles, car_models, showrooms,
-- promotions, leads, schedules)
-- ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sena_ev.wiki_edges (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_kind     TEXT NOT NULL,
  from_id       UUID NOT NULL,
  to_kind       TEXT NOT NULL,
  to_id         UUID NOT NULL,
  relation      TEXT NOT NULL,
    -- interested_in | owns | has_tag | about | led_to
    -- | mentioned | related_to | replaces | inspired_by
  weight        REAL NOT NULL DEFAULT 1.0,
  note          TEXT,
  source        TEXT,                          -- agent | bot | auto
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (from_kind, from_id, to_kind, to_id, relation)
);
CREATE INDEX IF NOT EXISTS idx_wiki_edges_from
  ON sena_ev.wiki_edges (from_kind, from_id);
CREATE INDEX IF NOT EXISTS idx_wiki_edges_to
  ON sena_ev.wiki_edges (to_kind, to_id);
CREATE INDEX IF NOT EXISTS idx_wiki_edges_relation
  ON sena_ev.wiki_edges (relation);

-- ─────────────────────────────────────────────────
-- bot_conversation_summaries — rolling summary so
-- conversation memory survives beyond N recent
-- messages.
-- ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sena_ev.bot_conversation_summaries (
  conversation_id    UUID PRIMARY KEY REFERENCES sena_ev.conversations(id) ON DELETE CASCADE,
  summary_md         TEXT NOT NULL DEFAULT '',
  through_message_id UUID REFERENCES sena_ev.messages(id) ON DELETE SET NULL,
  through_sent_at    TIMESTAMPTZ,
  token_count        INT,
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────
-- Triggers
-- ─────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_wiki_pages_touch') THEN
    CREATE TRIGGER trg_wiki_pages_touch BEFORE UPDATE ON sena_ev.wiki_pages
      FOR EACH ROW EXECUTE FUNCTION sena_ev.touch_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_customer_wiki_touch') THEN
    CREATE TRIGGER trg_customer_wiki_touch BEFORE UPDATE ON sena_ev.customer_wiki_pages
      FOR EACH ROW EXECUTE FUNCTION sena_ev.touch_updated_at();
  END IF;
END$$;
ALTER TABLE sena_ev.wiki_pages ADD COLUMN IF NOT EXISTS aliases TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE sena_ev.customer_wiki_pages ADD COLUMN IF NOT EXISTS aliases TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
CREATE INDEX IF NOT EXISTS idx_wiki_pages_aliases ON sena_ev.wiki_pages USING GIN (aliases);

-- Per-conversation bot autopilot toggle (default OFF — agent enables explicitly)
ALTER TABLE sena_ev.conversations ADD COLUMN IF NOT EXISTS bot_enabled BOOLEAN NOT NULL DEFAULT false;
