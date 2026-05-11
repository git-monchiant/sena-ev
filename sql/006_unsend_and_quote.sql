-- ====================================================
-- 006: Unsend tracking + quote support
-- - is_unsent / unsent_at — ลูกค้ากด Delete ในแชท
-- - quoted_message_id    — ข้อความนี้กำลังตอบกลับข้อความไหน
-- - quote_token          — token จาก LINE ใช้ส่ง quote-reply ภายหลัง
-- ====================================================

ALTER TABLE sena_ev.messages
  ADD COLUMN IF NOT EXISTS is_unsent         BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS unsent_at         TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS quoted_message_id UUID
        REFERENCES sena_ev.messages(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS quote_token       TEXT;

CREATE INDEX IF NOT EXISTS idx_messages_quoted
  ON sena_ev.messages(quoted_message_id)
  WHERE quoted_message_id IS NOT NULL;
