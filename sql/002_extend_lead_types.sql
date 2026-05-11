-- ====================================================
-- 002: Extend leads.type to allow 'follow'
-- Trigger: on LINE 'follow' webhook event, auto-create a lead
-- ====================================================

ALTER TABLE sena_ev.leads
  DROP CONSTRAINT IF EXISTS leads_type_check;

ALTER TABLE sena_ev.leads
  ADD CONSTRAINT leads_type_check
  CHECK (type IN ('quote', 'test_drive', 'trade_in', 'follow'));
