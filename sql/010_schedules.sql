-- ====================================================
-- 010: schedules — generic schedule table
-- Replaces service_bookings (which had 0 rows, so no
-- data migration required). Drop service_bookings.
-- ====================================================

CREATE TABLE IF NOT EXISTS sena_ev.schedules (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Classification
  type            TEXT NOT NULL,
    -- service | test_drive | follow_up | callback
    -- | document_delivery | internal_task | reminder | other
  subtype         TEXT,
    -- service: maintenance | repair | inspection | body_shop | tire
  title           TEXT NOT NULL,

  -- When / where
  scheduled_at    TIMESTAMPTZ NOT NULL,
  duration_minutes INT NOT NULL DEFAULT 60,
  all_day         BOOLEAN NOT NULL DEFAULT FALSE,
  showroom_id     UUID REFERENCES sena_ev.showrooms(id) ON DELETE SET NULL,
  location        TEXT,

  -- Relations
  customer_id     UUID REFERENCES sena_ev.customers(id) ON DELETE CASCADE,
  vehicle_id      UUID REFERENCES sena_ev.vehicles(id) ON DELETE SET NULL,
  lead_id         UUID REFERENCES sena_ev.leads(id) ON DELETE SET NULL,
  conversation_id UUID REFERENCES sena_ev.conversations(id) ON DELETE SET NULL,
  source_message_id UUID REFERENCES sena_ev.messages(id) ON DELETE SET NULL,

  -- Lifecycle
  status          TEXT NOT NULL DEFAULT 'NEW',
    -- NEW | CONFIRMED | IN_PROGRESS | DONE | CANCELLED | NO_SHOW
  priority        SMALLINT NOT NULL DEFAULT 2,  -- 1=high, 2=normal, 3=low

  -- Reminders
  remind_at       TIMESTAMPTZ,
  reminded_at     TIMESTAMPTZ,
  reminder_channel TEXT,

  -- Type-specific payload
  payload         JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- General
  notes           TEXT,
  tags            TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],

  -- Audit (agent ids without FK — agents table doesn't exist yet)
  created_by_agent_id UUID,
  assigned_agent_id   UUID,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at    TIMESTAMPTZ,
  cancelled_at    TIMESTAMPTZ,
  cancel_reason   TEXT,

  CONSTRAINT schedules_status_chk CHECK (
    status IN ('NEW','CONFIRMED','IN_PROGRESS','DONE','CANCELLED','NO_SHOW')
  ),
  CONSTRAINT schedules_type_chk CHECK (
    type IN ('service','test_drive','follow_up','callback',
             'document_delivery','internal_task','reminder','other')
  )
);

CREATE INDEX IF NOT EXISTS idx_schedules_scheduled_at
  ON sena_ev.schedules (scheduled_at);
CREATE INDEX IF NOT EXISTS idx_schedules_customer
  ON sena_ev.schedules (customer_id, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_schedules_agent
  ON sena_ev.schedules (assigned_agent_id, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_schedules_open
  ON sena_ev.schedules (status, scheduled_at)
  WHERE status IN ('NEW','CONFIRMED','IN_PROGRESS');
CREATE INDEX IF NOT EXISTS idx_schedules_type
  ON sena_ev.schedules (type, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_schedules_showroom
  ON sena_ev.schedules (showroom_id, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_schedules_conversation
  ON sena_ev.schedules (conversation_id);
CREATE INDEX IF NOT EXISTS idx_schedules_payload_gin
  ON sena_ev.schedules USING GIN (payload jsonb_path_ops);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_schedules_touch') THEN
    CREATE TRIGGER trg_schedules_touch BEFORE UPDATE ON sena_ev.schedules
      FOR EACH ROW EXECUTE FUNCTION sena_ev.touch_updated_at();
  END IF;
END$$;

-- Drop legacy service_bookings (had 0 rows; nothing to backfill)
DROP TABLE IF EXISTS sena_ev.service_bookings;
