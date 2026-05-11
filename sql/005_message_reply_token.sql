-- ====================================================
-- 005: Add reply_token tracking to messages
-- ใช้สำหรับ reply-first policy (ประหยัด push quota)
-- ====================================================

ALTER TABLE sena_ev.messages
  ADD COLUMN IF NOT EXISTS reply_token         TEXT,
  ADD COLUMN IF NOT EXISTS reply_token_used_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_messages_reply_token
  ON sena_ev.messages(conversation_id, sent_at DESC)
  WHERE reply_token IS NOT NULL AND reply_token_used_at IS NULL;
