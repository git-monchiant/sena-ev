-- ====================================================
-- 003: Chat schema (Phase B1)
-- conversations + messages — for Live Agent Console
-- ====================================================

CREATE TABLE IF NOT EXISTS sena_ev.conversations (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id           UUID NOT NULL UNIQUE
                        REFERENCES sena_ev.customers(id) ON DELETE CASCADE,
  status                TEXT NOT NULL DEFAULT 'open'
                        CHECK (status IN ('open', 'pending', 'closed')),
  assigned_agent_id     UUID,
  last_message_at       TIMESTAMPTZ,
  last_message_preview  TEXT,
  last_message_type     TEXT,
  unread_count          INT NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conversations_status
  ON sena_ev.conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message
  ON sena_ev.conversations(last_message_at DESC NULLS LAST);

CREATE TABLE IF NOT EXISTS sena_ev.messages (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id     UUID NOT NULL REFERENCES sena_ev.conversations(id) ON DELETE CASCADE,
  direction           TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound', 'system')),
  agent_id            UUID,
  line_message_id     TEXT,
  message_type        TEXT NOT NULL,
  content             JSONB NOT NULL DEFAULT '{}'::jsonb,
  raw_payload         JSONB,
  is_internal_note    BOOLEAN NOT NULL DEFAULT false,
  sent_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  delivered_at        TIMESTAMPTZ,
  read_at             TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation
  ON sena_ev.messages(conversation_id, sent_at);
CREATE INDEX IF NOT EXISTS idx_messages_line_id
  ON sena_ev.messages(line_message_id)
  WHERE line_message_id IS NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_conversations_touch') THEN
    CREATE TRIGGER trg_conversations_touch BEFORE UPDATE ON sena_ev.conversations
      FOR EACH ROW EXECUTE FUNCTION sena_ev.touch_updated_at();
  END IF;
END$$;
