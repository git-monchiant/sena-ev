-- ====================================================
-- 004: Rename customer state GUEST → LEAD
-- ทุกคนที่ add OA = lead ทันที (ไม่ใช่ guest)
-- ====================================================

ALTER TABLE sena_ev.customers DROP CONSTRAINT IF EXISTS customers_state_check;

UPDATE sena_ev.customers SET state = 'LEAD' WHERE state = 'GUEST';

ALTER TABLE sena_ev.customers
  ADD CONSTRAINT customers_state_check
  CHECK (state IN ('LEAD', 'PROSPECT', 'OWNER'));

ALTER TABLE sena_ev.customers ALTER COLUMN state SET DEFAULT 'LEAD';
