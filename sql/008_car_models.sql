-- ====================================================
-- 008: car_models — รุ่นรถที่ขาย (catalog master)
-- Per REQUIREMENTS.md section 6.2
-- ====================================================

CREATE TABLE IF NOT EXISTS sena_ev.car_models (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT NOT NULL UNIQUE,
  name            TEXT NOT NULL,
  brand           TEXT NOT NULL,
  body_type       TEXT,
  price_baht      NUMERIC(12, 2),
  brochure_url    TEXT,
  spec            JSONB NOT NULL DEFAULT '{}'::jsonb,
  colors          TEXT[] NOT NULL DEFAULT '{}',
  images          TEXT[] NOT NULL DEFAULT '{}',
  sort_order      INT NOT NULL DEFAULT 0,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_car_models_brand
  ON sena_ev.car_models(brand);
CREATE INDEX IF NOT EXISTS idx_car_models_active
  ON sena_ev.car_models(is_active, sort_order);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_car_models_touch') THEN
    CREATE TRIGGER trg_car_models_touch BEFORE UPDATE ON sena_ev.car_models
      FOR EACH ROW EXECUTE FUNCTION sena_ev.touch_updated_at();
  END IF;
END$$;
