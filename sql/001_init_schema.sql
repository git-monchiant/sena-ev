-- ====================================================
-- Sena EV — Init schema (LINE-side tables)
-- Per REQUIREMENTS.md section 6.1
-- ====================================================
-- Run: psql -f sql/001_init_schema.sql

SET search_path TO sena_ev, public;

-- ----------------------------------------------------
-- customers — LINE user เก็บ profile + state
-- ----------------------------------------------------
CREATE TABLE IF NOT EXISTS sena_ev.customers (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  line_user_id        TEXT NOT NULL UNIQUE,
  display_name        TEXT,
  picture_url         TEXT,
  phone               TEXT,
  email               TEXT,
  state               TEXT NOT NULL DEFAULT 'GUEST'
                      CHECK (state IN ('GUEST', 'PROSPECT', 'OWNER')),
  state_changed_at    TIMESTAMPTZ,
  followed_at         TIMESTAMPTZ,
  unfollowed_at       TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customers_phone ON sena_ev.customers(phone)
  WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_customers_state ON sena_ev.customers(state);

-- ----------------------------------------------------
-- customer_richmenu_state — Rich Menu ที่ผูกกับ user ปัจจุบัน
-- ----------------------------------------------------
CREATE TABLE IF NOT EXISTS sena_ev.customer_richmenu_state (
  customer_id         UUID PRIMARY KEY REFERENCES sena_ev.customers(id) ON DELETE CASCADE,
  current_menu        TEXT NOT NULL
                      CHECK (current_menu IN ('presale', 'owner')),
  linked_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------
-- leads — quote / test_drive / trade_in submissions
-- ----------------------------------------------------
CREATE TABLE IF NOT EXISTS sena_ev.leads (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id         UUID NOT NULL REFERENCES sena_ev.customers(id) ON DELETE CASCADE,
  type                TEXT NOT NULL
                      CHECK (type IN ('quote', 'test_drive', 'trade_in')),
  model_interest      TEXT,
  dealer_id           TEXT,
  payload             JSONB NOT NULL DEFAULT '{}'::jsonb,
  status              TEXT NOT NULL DEFAULT 'NEW'
                      CHECK (status IN ('NEW', 'CONTACTED', 'CONVERTED', 'LOST')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leads_customer ON sena_ev.leads(customer_id);
CREATE INDEX IF NOT EXISTS idx_leads_status   ON sena_ev.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_type     ON sena_ev.leads(type);

-- ----------------------------------------------------
-- service_bookings — after-sales service appointments
-- ----------------------------------------------------
CREATE TABLE IF NOT EXISTS sena_ev.service_bookings (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id         UUID NOT NULL REFERENCES sena_ev.customers(id) ON DELETE CASCADE,
  vehicle_id          UUID,            -- ref back-office vehicle_buyers.id (no FK cross-schema)
  service_type        TEXT NOT NULL
                      CHECK (service_type IN ('maintenance', 'repair', 'inspection')),
  scheduled_at        TIMESTAMPTZ NOT NULL,
  service_center      TEXT,
  status              TEXT NOT NULL DEFAULT 'NEW'
                      CHECK (status IN ('NEW', 'CONFIRMED', 'DONE', 'CANCELLED')),
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_service_customer  ON sena_ev.service_bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_service_scheduled ON sena_ev.service_bookings(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_service_status    ON sena_ev.service_bookings(status);

-- ----------------------------------------------------
-- notifications — push messages inbox
-- ----------------------------------------------------
CREATE TABLE IF NOT EXISTS sena_ev.notifications (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id         UUID NOT NULL REFERENCES sena_ev.customers(id) ON DELETE CASCADE,
  type                TEXT NOT NULL
                      CHECK (type IN ('service_reminder', 'promo', 'lead_followup', 'system')),
  title               TEXT NOT NULL,
  body                TEXT,
  cta_url             TEXT,
  sent_at             TIMESTAMPTZ,
  read_at             TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_notifications_customer ON sena_ev.notifications(customer_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread
  ON sena_ev.notifications(customer_id, sent_at DESC)
  WHERE read_at IS NULL;

-- ----------------------------------------------------
-- (otp_verifications skipped — phone verification deferred)
-- ----------------------------------------------------

-- ----------------------------------------------------
-- webhook_events — raw LINE webhook log (debug + audit)
-- ----------------------------------------------------
CREATE TABLE IF NOT EXISTS sena_ev.webhook_events (
  id                  BIGSERIAL PRIMARY KEY,
  event_type          TEXT NOT NULL,
  line_user_id        TEXT,
  payload             JSONB NOT NULL,
  received_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_user ON sena_ev.webhook_events(line_user_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_type ON sena_ev.webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_time ON sena_ev.webhook_events(received_at DESC);

-- ----------------------------------------------------
-- updated_at auto-touch trigger
-- ----------------------------------------------------
CREATE OR REPLACE FUNCTION sena_ev.touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_customers_touch') THEN
    CREATE TRIGGER trg_customers_touch BEFORE UPDATE ON sena_ev.customers
      FOR EACH ROW EXECUTE FUNCTION sena_ev.touch_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_leads_touch') THEN
    CREATE TRIGGER trg_leads_touch BEFORE UPDATE ON sena_ev.leads
      FOR EACH ROW EXECUTE FUNCTION sena_ev.touch_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_service_touch') THEN
    CREATE TRIGGER trg_service_touch BEFORE UPDATE ON sena_ev.service_bookings
      FOR EACH ROW EXECUTE FUNCTION sena_ev.touch_updated_at();
  END IF;
END$$;
