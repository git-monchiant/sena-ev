-- ====================================================
-- 009: LIFF master data
-- showrooms, promotions, shop_items, vehicles,
-- insurance_policies, service_types, company_settings,
-- emergency_contacts
-- ====================================================

-- Ensure touch trigger function exists (idempotent)
CREATE OR REPLACE FUNCTION sena_ev.touch_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─────────────────────────────────────────────────
-- showrooms / service centers
-- ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sena_ev.showrooms (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT NOT NULL UNIQUE,
  name            TEXT NOT NULL,
  short_name      TEXT,
  address         TEXT NOT NULL,
  district        TEXT,
  province        TEXT,
  postal_code     TEXT,
  phone           TEXT,
  lat             NUMERIC(10, 7),
  lng             NUMERIC(10, 7),
  gmap_url        TEXT,
  opens_at        TIME,
  closes_at       TIME,
  days_open       INT[] NOT NULL DEFAULT ARRAY[1,2,3,4,5,6],
    -- 0=Sun, 1=Mon ... 6=Sat
  services        TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    -- showroom | service | body_shop | ev_charger | test_drive
  default_slots_per_hour INT NOT NULL DEFAULT 2,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  sort_order      INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_showrooms_active
  ON sena_ev.showrooms(is_active, sort_order);

-- ─────────────────────────────────────────────────
-- promotions
-- ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sena_ev.promotions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT NOT NULL UNIQUE,
  title           TEXT NOT NULL,
  description     TEXT,
  type            TEXT NOT NULL,
    -- interest_rate | free_insurance | cash_discount
    -- | free_gift | trade_in_boost | other
  badge           TEXT,
  payload         JSONB NOT NULL DEFAULT '{}'::jsonb,
  bank_name       TEXT,
  valid_from      TIMESTAMPTZ,
  valid_to        TIMESTAMPTZ,
  applicable_model_ids UUID[] NOT NULL DEFAULT ARRAY[]::UUID[],
  is_active       BOOLEAN NOT NULL DEFAULT true,
  sort_order      INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_promotions_active
  ON sena_ev.promotions(is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_promotions_dates
  ON sena_ev.promotions(valid_from, valid_to);

-- ─────────────────────────────────────────────────
-- shop_items
-- ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sena_ev.shop_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT NOT NULL UNIQUE,
  title           TEXT NOT NULL,
  description     TEXT,
  category        TEXT NOT NULL,
    -- insurance | tax | charger | service_package | accessory | warranty
  icon_name       TEXT,
  image_url       TEXT,
  price_baht      NUMERIC(12, 2),
  price_label     TEXT,
  badge           TEXT,
  link_url        TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  sort_order      INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_shop_items_active
  ON sena_ev.shop_items(is_active, sort_order);

-- ─────────────────────────────────────────────────
-- service_types (master)
-- ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sena_ev.service_types (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT NOT NULL UNIQUE,
  name_th         TEXT NOT NULL,
  name_en         TEXT,
  default_duration_minutes INT NOT NULL DEFAULT 60,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  sort_order      INT NOT NULL DEFAULT 0
);

-- ─────────────────────────────────────────────────
-- vehicles (customer-owned EVs)
-- ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sena_ev.vehicles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id     UUID NOT NULL REFERENCES sena_ev.customers(id) ON DELETE CASCADE,
  model_id        UUID REFERENCES sena_ev.car_models(id) ON DELETE SET NULL,
  color           TEXT,
  license_plate   TEXT,
  vin             TEXT UNIQUE,
  delivered_at    DATE,
  warranty_until  DATE,
  current_mileage_km INT,
  battery_pct     INT,
  battery_updated_at TIMESTAMPTZ,
  last_service_at TIMESTAMPTZ,
  next_service_due_at TIMESTAMPTZ,
  primary_showroom_id UUID REFERENCES sena_ev.showrooms(id) ON DELETE SET NULL,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_vehicles_customer
  ON sena_ev.vehicles(customer_id);

-- ─────────────────────────────────────────────────
-- insurance_policies
-- ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sena_ev.insurance_policies (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id      UUID NOT NULL REFERENCES sena_ev.vehicles(id) ON DELETE CASCADE,
  provider        TEXT NOT NULL,
  class           TEXT NOT NULL,
  policy_no       TEXT,
  valid_from      DATE,
  valid_to        DATE,
  premium_baht    NUMERIC(12, 2),
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_insurance_vehicle
  ON sena_ev.insurance_policies(vehicle_id);

-- ─────────────────────────────────────────────────
-- company_settings (KV) — tagline, hotline, social links
-- ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sena_ev.company_settings (
  key             TEXT PRIMARY KEY,
  value           JSONB NOT NULL,
  description     TEXT,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────
-- emergency_contacts (SOS hotlines)
-- ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sena_ev.emergency_contacts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT NOT NULL UNIQUE,
    -- hotline | breakdown | charging | body_shop ...
  label_th        TEXT NOT NULL,
  phone           TEXT NOT NULL,
  description     TEXT,
  is_primary      BOOLEAN NOT NULL DEFAULT false,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  sort_order      INT NOT NULL DEFAULT 0
);

-- ─────────────────────────────────────────────────
-- Triggers
-- ─────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_showrooms_touch') THEN
    CREATE TRIGGER trg_showrooms_touch BEFORE UPDATE ON sena_ev.showrooms
      FOR EACH ROW EXECUTE FUNCTION sena_ev.touch_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_promotions_touch') THEN
    CREATE TRIGGER trg_promotions_touch BEFORE UPDATE ON sena_ev.promotions
      FOR EACH ROW EXECUTE FUNCTION sena_ev.touch_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_shop_items_touch') THEN
    CREATE TRIGGER trg_shop_items_touch BEFORE UPDATE ON sena_ev.shop_items
      FOR EACH ROW EXECUTE FUNCTION sena_ev.touch_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_vehicles_touch') THEN
    CREATE TRIGGER trg_vehicles_touch BEFORE UPDATE ON sena_ev.vehicles
      FOR EACH ROW EXECUTE FUNCTION sena_ev.touch_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_insurance_touch') THEN
    CREATE TRIGGER trg_insurance_touch BEFORE UPDATE ON sena_ev.insurance_policies
      FOR EACH ROW EXECUTE FUNCTION sena_ev.touch_updated_at();
  END IF;
END$$;
