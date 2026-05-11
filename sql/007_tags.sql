-- ====================================================
-- 007: Tags + customer tags
-- ====================================================

CREATE TABLE IF NOT EXISTS sena_ev.tags (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL UNIQUE,
  category        TEXT NOT NULL DEFAULT 'other'
                  CHECK (category IN ('intent','model','service','other')),
  color           TEXT NOT NULL DEFAULT '#6b7280',
  description     TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  sort_order      INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tags_category
  ON sena_ev.tags(category) WHERE is_active;

CREATE TABLE IF NOT EXISTS sena_ev.customer_tags (
  customer_id     UUID NOT NULL REFERENCES sena_ev.customers(id) ON DELETE CASCADE,
  tag_id          UUID NOT NULL REFERENCES sena_ev.tags(id) ON DELETE CASCADE,
  tagged_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  tagged_by       UUID,
  note            TEXT,
  PRIMARY KEY (customer_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_customer_tags_customer
  ON sena_ev.customer_tags(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_tags_tag
  ON sena_ev.customer_tags(tag_id);

-- ---------- Seed default tags ----------
INSERT INTO sena_ev.tags (name, category, color, sort_order) VALUES
  ('สนใจซื้อรถ',          'intent',  '#10b981', 10),
  ('ทดลองขับ',            'intent',  '#3b82f6', 20),
  ('ขอใบเสนอราคา',        'intent',  '#8b5cf6', 30),
  ('Trade-in',            'intent',  '#f97316', 40),
  ('สอบถาม Financing',    'intent',  '#eab308', 50),

  ('BYD Atto 3',          'model',   '#0ea5e9', 110),
  ('BYD Dolphin',         'model',   '#0ea5e9', 120),
  ('MG EP',               'model',   '#0ea5e9', 130),
  ('Tesla Model Y',       'model',   '#0ea5e9', 140),

  ('นัดเซอร์วิส',         'service', '#f97316', 210),
  ('ประกัน',              'service', '#f97316', 220),
  ('ต่อภาษี',             'service', '#f97316', 230),
  ('Warranty claim',      'service', '#f97316', 240),

  ('VIP',                 'other',   '#dc2626', 310),
  ('ติดตามอยู่',          'other',   '#06b6d4', 320),
  ('ไม่สนใจแล้ว',         'other',   '#9ca3af', 330)
ON CONFLICT (name) DO NOTHING;
