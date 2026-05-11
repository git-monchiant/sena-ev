-- ====================================================
-- 008: Remove PROSPECT state
-- ระบบใช้แค่ LEAD (ผู้สนใจ) และ OWNER (ลูกค้าที่ซื้อแล้ว)
-- ====================================================

ALTER TABLE sena_ev.customers DROP CONSTRAINT IF EXISTS customers_state_check;

UPDATE sena_ev.customers SET state = 'LEAD' WHERE state = 'PROSPECT';

ALTER TABLE sena_ev.customers
  ADD CONSTRAINT customers_state_check
  CHECK (state IN ('LEAD', 'OWNER'));
