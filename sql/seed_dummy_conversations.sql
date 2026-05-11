-- ====================================================
-- SEED: 5 dummy conversations for inbox development
-- Re-runnable: deletes existing dummies (line_user_id like 'U_dummy_%')
-- Run: psql -f sql/seed_dummy_conversations.sql
-- ====================================================

BEGIN;

-- ----------------------------------------------------
-- Cleanup previous seed data
-- ----------------------------------------------------
DELETE FROM sena_ev.messages
WHERE conversation_id IN (
  SELECT c.id FROM sena_ev.conversations c
  JOIN sena_ev.customers cu ON cu.id = c.customer_id
  WHERE cu.line_user_id LIKE 'U_dummy_%'
);

DELETE FROM sena_ev.conversations
WHERE customer_id IN (
  SELECT id FROM sena_ev.customers WHERE line_user_id LIKE 'U_dummy_%'
);

DELETE FROM sena_ev.customers WHERE line_user_id LIKE 'U_dummy_%';

-- ----------------------------------------------------
-- Seed 5 customers + conversations + messages
-- ----------------------------------------------------
DO $$
DECLARE
  v_customer_id UUID;
  v_conv_id     UUID;
BEGIN

  -- ============================================================
  -- #1 คุณสมศักดิ์ ตั้งใจ — PROSPECT, asking about EV-X (unread=1)
  -- ============================================================
  INSERT INTO sena_ev.customers
    (line_user_id, display_name, picture_url, phone, state, state_changed_at, followed_at)
  VALUES
    ('U_dummy_001', 'สมศักดิ์ ตั้งใจ',
     'https://i.pravatar.cc/150?img=12', '0812345001',
     'PROSPECT', now() - interval '2 days', now() - interval '7 days')
  RETURNING id INTO v_customer_id;

  INSERT INTO sena_ev.conversations
    (customer_id, status, last_message_at, last_message_preview, last_message_type, unread_count)
  VALUES
    (v_customer_id, 'open', now() - interval '15 minutes',
     'ราคาผ่อน 60 เดือนเท่าไหร่ครับ', 'text', 1)
  RETURNING id INTO v_conv_id;

  INSERT INTO sena_ev.messages (conversation_id, direction, message_type, content, sent_at) VALUES
    (v_conv_id, 'inbound',  'text', '{"text":"สวัสดีครับ สนใจ EV-X"}'::jsonb,                                 now() - interval '60 minutes'),
    (v_conv_id, 'outbound', 'text', '{"text":"สวัสดีค่ะ พี่สมศักดิ์ EV-X เป็นรุ่นที่โปรพอดีค่ะ สนใจสีไหนคะ"}'::jsonb, now() - interval '58 minutes'),
    (v_conv_id, 'inbound',  'text', '{"text":"range วิ่งได้กี่กิโลครับ"}'::jsonb,                              now() - interval '55 minutes'),
    (v_conv_id, 'outbound', 'text', '{"text":"WLTP 500 km ค่ะ ใช้จริงประมาณ 430-450 km ขึ้นกับการขับ"}'::jsonb, now() - interval '53 minutes'),
    (v_conv_id, 'inbound',  'text', '{"text":"ราคาเท่าไหร่"}'::jsonb,                                          now() - interval '50 minutes'),
    (v_conv_id, 'outbound', 'text', '{"text":"1.8M-2.4M ตามรุ่นย่อยค่ะ เดี๋ยวส่ง brochure ให้นะคะ"}'::jsonb,    now() - interval '48 minutes'),
    (v_conv_id, 'outbound', 'flex', '{"altText":"Brochure SENA EV-X","title":"SENA EV-X 2026","subtitle":"500km · 0-100 in 3.2s","ctaUrl":"https://senaev.ngrok.app/material/ev-x.pdf"}'::jsonb, now() - interval '47 minutes'),
    (v_conv_id, 'inbound',  'text', '{"text":"ราคาผ่อน 60 เดือนเท่าไหร่ครับ"}'::jsonb,                          now() - interval '15 minutes');

  -- ============================================================
  -- #2 คุณมาลี สวยงาม — LEAD, just followed (unread=1)
  -- ============================================================
  INSERT INTO sena_ev.customers
    (line_user_id, display_name, picture_url, phone, state, followed_at)
  VALUES
    ('U_dummy_002', 'มาลี สวยงาม',
     'https://i.pravatar.cc/150?img=45', NULL,
     'LEAD', now() - interval '30 minutes')
  RETURNING id INTO v_customer_id;

  INSERT INTO sena_ev.conversations
    (customer_id, status, last_message_at, last_message_preview, last_message_type, unread_count)
  VALUES
    (v_customer_id, 'open', now() - interval '25 minutes',
     'มีรุ่นไหนบ้างคะ', 'text', 1)
  RETURNING id INTO v_conv_id;

  INSERT INTO sena_ev.messages (conversation_id, direction, message_type, content, sent_at) VALUES
    (v_conv_id, 'system',  'text', '{"text":"ยินดีต้อนรับสู่ Sena EV ค่ะ ทีมงานจะติดต่อกลับโดยเร็ว"}'::jsonb, now() - interval '30 minutes'),
    (v_conv_id, 'inbound', 'text', '{"text":"มีรุ่นไหนบ้างคะ"}'::jsonb,                                       now() - interval '25 minutes');

  -- ============================================================
  -- #3 คุณวิชัย ผ่องใส — OWNER, service confirmed, closed (unread=0)
  -- ============================================================
  INSERT INTO sena_ev.customers
    (line_user_id, display_name, picture_url, phone, state, state_changed_at, followed_at)
  VALUES
    ('U_dummy_003', 'วิชัย ผ่องใส',
     'https://i.pravatar.cc/150?img=8', '0812345003',
     'OWNER', now() - interval '90 days', now() - interval '120 days')
  RETURNING id INTO v_customer_id;

  INSERT INTO sena_ev.conversations
    (customer_id, status, last_message_at, last_message_preview, last_message_type, unread_count)
  VALUES
    (v_customer_id, 'closed', now() - interval '1 day',
     'ขอบคุณค่ะ พบกันวันเสาร์', 'text', 0)
  RETURNING id INTO v_conv_id;

  INSERT INTO sena_ev.messages (conversation_id, direction, message_type, content, sent_at) VALUES
    (v_conv_id, 'inbound',  'text', '{"text":"ขอจองเช็คระยะ 20,000 ครับ"}'::jsonb,                            now() - interval '2 days 3 hours'),
    (v_conv_id, 'outbound', 'text', '{"text":"รับเรื่องค่ะ พี่วิชัยสะดวกวันไหนคะ"}'::jsonb,                       now() - interval '2 days 2 hours 55 minutes'),
    (v_conv_id, 'inbound',  'text', '{"text":"เสาร์หน้า บ่าย ๆ ครับ"}'::jsonb,                                 now() - interval '2 days 2 hours 50 minutes'),
    (v_conv_id, 'outbound', 'text', '{"text":"เสาร์ที่ 16/05 เวลา 13:00 ที่ศูนย์รามอินทรา สะดวกไหมคะ"}'::jsonb, now() - interval '2 days 2 hours 45 minutes'),
    (v_conv_id, 'inbound',  'text', '{"text":"ok ครับ ขอบคุณ"}'::jsonb,                                       now() - interval '1 day 5 hours'),
    (v_conv_id, 'outbound', 'flex', '{"altText":"Booking confirmed #SV-2026-1234","title":"Service Booking #1234","subtitle":"เช็คระยะ 20,000 km","date":"2026-05-16 13:00","center":"ศูนย์รามอินทรา"}'::jsonb, now() - interval '1 day 4 hours 58 minutes'),
    (v_conv_id, 'outbound', 'text', '{"text":"ขอบคุณค่ะ พบกันวันเสาร์ 16/05 นะคะ"}'::jsonb,                    now() - interval '1 day');

  -- ============================================================
  -- #4 คุณนภา แสงทอง — PROSPECT, test drive request (unread=1, fresh)
  -- ============================================================
  INSERT INTO sena_ev.customers
    (line_user_id, display_name, picture_url, phone, state, state_changed_at, followed_at)
  VALUES
    ('U_dummy_004', 'นภา แสงทอง',
     'https://i.pravatar.cc/150?img=32', '0812345004',
     'PROSPECT', now() - interval '3 hours', now() - interval '4 hours')
  RETURNING id INTO v_customer_id;

  INSERT INTO sena_ev.conversations
    (customer_id, status, last_message_at, last_message_preview, last_message_type, unread_count)
  VALUES
    (v_customer_id, 'open', now() - interval '4 minutes',
     'สาขาไหนสะดวกบ้างคะ', 'text', 1)
  RETURNING id INTO v_conv_id;

  INSERT INTO sena_ev.messages (conversation_id, direction, message_type, content, sent_at) VALUES
    (v_conv_id, 'inbound', 'text', '{"text":"อยากทดลองขับ EV-X ค่ะ"}'::jsonb,    now() - interval '5 minutes'),
    (v_conv_id, 'inbound', 'text', '{"text":"สาขาไหนสะดวกบ้างคะ"}'::jsonb,        now() - interval '4 minutes');

  -- ============================================================
  -- #5 คุณธนา ใจดี — OWNER, SOS urgent (unread=3, pending)
  -- ============================================================
  INSERT INTO sena_ev.customers
    (line_user_id, display_name, picture_url, phone, state, state_changed_at, followed_at)
  VALUES
    ('U_dummy_005', 'ธนา ใจดี',
     'https://i.pravatar.cc/150?img=68', '0812345005',
     'OWNER', now() - interval '180 days', now() - interval '200 days')
  RETURNING id INTO v_customer_id;

  INSERT INTO sena_ev.conversations
    (customer_id, status, last_message_at, last_message_preview, last_message_type, unread_count)
  VALUES
    (v_customer_id, 'pending', now() - interval '1 minute',
     '🚨 ช่วยด้วยครับ', 'text', 3)
  RETURNING id INTO v_conv_id;

  INSERT INTO sena_ev.messages (conversation_id, direction, message_type, content, sent_at) VALUES
    (v_conv_id, 'inbound', 'text',     '{"text":"รถสตาร์ทไม่ติดครับ เพิ่งจอดมา 1 ชั่วโมง"}'::jsonb,                              now() - interval '3 minutes'),
    (v_conv_id, 'inbound', 'location', '{"latitude":13.7563,"longitude":100.5018,"title":"ตำแหน่งปัจจุบัน","address":"สีลม กรุงเทพ"}'::jsonb, now() - interval '2 minutes'),
    (v_conv_id, 'inbound', 'text',     '{"text":"🚨 ช่วยด้วยครับ"}'::jsonb,                                                       now() - interval '1 minute');

END $$;

COMMIT;

-- ----------------------------------------------------
-- Verify
-- ----------------------------------------------------
SELECT
  cust.display_name,
  cust.state,
  conv.status,
  conv.unread_count,
  conv.last_message_preview,
  (SELECT COUNT(*) FROM sena_ev.messages m WHERE m.conversation_id = conv.id) AS msg_count
FROM sena_ev.conversations conv
JOIN sena_ev.customers cust ON cust.id = conv.customer_id
WHERE cust.line_user_id LIKE 'U_dummy_%'
ORDER BY conv.last_message_at DESC;
