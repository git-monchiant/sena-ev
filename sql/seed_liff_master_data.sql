-- ====================================================
-- Seed: LIFF master data (idempotent via ON CONFLICT)
-- ====================================================

-- ─── showrooms ───
INSERT INTO sena_ev.showrooms
  (slug, name, short_name, address, district, province, phone,
   lat, lng, gmap_url, opens_at, closes_at, days_open, services, sort_order)
VALUES
  ('bangna', 'Sena Green Auto — Bangna', 'Bangna',
   'Bangna-Trat Rd, Bangkok', 'บางนา', 'กรุงเทพมหานคร', '02-000-0001',
   13.6678, 100.6092,
   'https://maps.app.goo.gl/t3gGnL88RZQ3yUPF9',
   '10:00', '20:00',
   ARRAY[1,2,3,4,5,6],
   ARRAY['showroom','service','test_drive','ev_charger','body_shop'],
   10),
  ('ratchayothin', 'Sena Green Auto — รัชโยธิน', 'รัชโยธิน',
   'ถ.พหลโยธิน เขตจตุจักร', 'จตุจักร', 'กรุงเทพมหานคร', '02-000-0002',
   13.8362, 100.5675, NULL,
   '10:00', '20:00',
   ARRAY[1,2,3,4,5,6],
   ARRAY['showroom','service','test_drive'],
   20),
  ('bangyai', 'Sena Green Auto — บางใหญ่', 'บางใหญ่',
   'อ.บางใหญ่ จ.นนทบุรี', 'บางใหญ่', 'นนทบุรี', '02-000-0003',
   13.8814, 100.4111, NULL,
   '09:00', '19:00',
   ARRAY[1,2,3,4,5,6],
   ARRAY['showroom','service','test_drive','ev_charger'],
   30)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  short_name = EXCLUDED.short_name,
  address = EXCLUDED.address,
  district = EXCLUDED.district,
  province = EXCLUDED.province,
  phone = EXCLUDED.phone,
  lat = EXCLUDED.lat,
  lng = EXCLUDED.lng,
  gmap_url = COALESCE(EXCLUDED.gmap_url, sena_ev.showrooms.gmap_url),
  opens_at = EXCLUDED.opens_at,
  closes_at = EXCLUDED.closes_at,
  days_open = EXCLUDED.days_open,
  services = EXCLUDED.services,
  sort_order = EXCLUDED.sort_order;

-- ─── service_types ───
INSERT INTO sena_ev.service_types
  (slug, name_th, name_en, default_duration_minutes, sort_order)
VALUES
  ('maintenance', 'เช็คระยะ', 'Maintenance', 60, 10),
  ('inspection',  'ตรวจสภาพ', 'Inspection',  45, 20),
  ('repair',      'ซ่อม',     'Repair',     120, 30),
  ('body_shop',   'ซ่อมสีและตัวถัง', 'Body shop', 240, 40),
  ('tire',        'ยาง / ล้อ', 'Tire / Wheel', 60, 50)
ON CONFLICT (slug) DO UPDATE SET
  name_th = EXCLUDED.name_th,
  name_en = EXCLUDED.name_en,
  default_duration_minutes = EXCLUDED.default_duration_minutes,
  sort_order = EXCLUDED.sort_order;

-- ─── promotions ───
INSERT INTO sena_ev.promotions
  (slug, title, description, type, badge, payload, bank_name, sort_order)
VALUES
  ('rate-199-48m',
   'ดอกเบี้ย 1.99% นาน 48 เดือน',
   'อัตราดอกเบี้ยพิเศษสำหรับรถ EV ทุกรุ่น',
   'interest_rate', 'พิเศษ',
   '{"rate": 1.99, "months": 48}'::jsonb,
   'ธ.กรุงเทพ', 10),
  ('free-insurance-y1',
   'ฟรีประกันชั้น 1 ปีแรก',
   'รับฟรีประกันชั้น 1 มูลค่าสูงสุด 25,000 บาท เมื่อออกรถ EV',
   'free_insurance', 'ฮอตฮิต',
   '{"max_value_baht": 25000, "class": "1"}'::jsonb,
   NULL, 20)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  type = EXCLUDED.type,
  badge = EXCLUDED.badge,
  payload = EXCLUDED.payload,
  bank_name = EXCLUDED.bank_name,
  sort_order = EXCLUDED.sort_order;

-- ─── shop_items ───
INSERT INTO sena_ev.shop_items
  (slug, title, description, category, icon_name, badge, sort_order)
VALUES
  ('insurance-class-1', 'ประกันชั้น 1',
   'ครอบคลุมทุกอย่าง · ผ่อนได้',
   'insurance', 'ShieldCheck', 'Popular', 10),
  ('tax-online', 'ต่อภาษีออนไลน์',
   'สะดวก ไม่ต้องไปขนส่ง',
   'tax', 'FileText', NULL, 20),
  ('wall-charger', 'Wall Charger',
   'ที่บ้านชาร์จเร็วกว่า 6 เท่า',
   'charger', 'Plug', NULL, 30),
  ('service-package', 'Package เช็คระยะ',
   'ราคาประหยัด คุ้มกว่าจ่ายรายครั้ง',
   'service_package', 'Wrench', NULL, 40),
  ('accessories', 'Accessories',
   'ของแต่งรถ ฟิล์ม กล้องติดรถ',
   'accessory', 'Gift', NULL, 50)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  icon_name = EXCLUDED.icon_name,
  badge = EXCLUDED.badge,
  sort_order = EXCLUDED.sort_order;

-- ─── emergency_contacts ───
INSERT INTO sena_ev.emergency_contacts
  (slug, label_th, phone, description, is_primary, sort_order)
VALUES
  ('hotline', 'Hotline 24 ชม.',           '1666', 'ศูนย์ช่วยเหลือ Sena EV', true, 10),
  ('breakdown', 'รถเสีย / ลากรถ',         '02-000-0911', NULL, false, 20),
  ('charging',  'แบตหมด / ชาร์จ',         '02-000-0912', NULL, false, 30)
ON CONFLICT (slug) DO UPDATE SET
  label_th = EXCLUDED.label_th,
  phone = EXCLUDED.phone,
  description = EXCLUDED.description,
  is_primary = EXCLUDED.is_primary,
  sort_order = EXCLUDED.sort_order;

-- ─── company_settings ───
INSERT INTO sena_ev.company_settings (key, value, description) VALUES
  ('brand', '{"name_th":"เสนา กรีน ออโตโมทีฟ","name_en":"SENA Green Auto","tagline":"Drive the Future."}'::jsonb, 'Company brand'),
  ('contact', '{"phone":"085-561-4666","website":"https://senagreenauto.co.th/","email":null}'::jsonb, 'Public contact'),
  ('social', '{"facebook":null,"youtube":null,"tiktok":null,"line":null}'::jsonb, 'Social links'),
  ('liff_id', '"replace-me"'::jsonb, 'Active LIFF ID')
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  updated_at = now();

-- ─── vehicles + insurance for existing OWNER customers ───
-- วิชัย ผ่องใส → DEEPAL S07 (silver)
-- ธนา ใจดี → JAECOO J7 (white)
DO $$
DECLARE
  v_wichai UUID;
  v_thana  UUID;
  m_s07    UUID;
  m_j7     UUID;
  sr_bangna UUID;
  veh_wichai UUID;
  veh_thana  UUID;
BEGIN
  SELECT id INTO v_wichai FROM sena_ev.customers WHERE display_name = 'วิชัย ผ่องใส' LIMIT 1;
  SELECT id INTO v_thana  FROM sena_ev.customers WHERE display_name = 'ธนา ใจดี'   LIMIT 1;
  SELECT id INTO m_s07    FROM sena_ev.car_models WHERE slug = 'deepal-s07';
  SELECT id INTO m_j7     FROM sena_ev.car_models WHERE slug = 'jaecoo-j7';
  SELECT id INTO sr_bangna FROM sena_ev.showrooms WHERE slug = 'bangna';

  IF v_wichai IS NOT NULL AND m_s07 IS NOT NULL THEN
    INSERT INTO sena_ev.vehicles
      (customer_id, model_id, color, license_plate, vin,
       delivered_at, warranty_until, current_mileage_km,
       battery_pct, battery_updated_at,
       next_service_due_at, primary_showroom_id)
    VALUES
      (v_wichai, m_s07, 'เทาเงิน', 'กก 1234 กทม', 'LGXDS07' || substr(md5(v_wichai::text),1,10),
       '2026-01-15', '2031-01-15', 8420,
       92, now() - interval '2 hours',
       '2026-06-15 10:00:00+07', sr_bangna)
    ON CONFLICT (vin) DO UPDATE SET
      color = EXCLUDED.color,
      license_plate = EXCLUDED.license_plate
    RETURNING id INTO veh_wichai;

    INSERT INTO sena_ev.insurance_policies
      (vehicle_id, provider, class, policy_no, valid_from, valid_to, premium_baht)
    VALUES
      (veh_wichai, 'วิริยะประกันภัย', '1',
       'V-2026-' || substr(md5(veh_wichai::text),1,8),
       '2026-01-15', '2027-01-14', 18500)
    ON CONFLICT DO NOTHING;
  END IF;

  IF v_thana IS NOT NULL AND m_j7 IS NOT NULL THEN
    INSERT INTO sena_ev.vehicles
      (customer_id, model_id, color, license_plate, vin,
       delivered_at, warranty_until, current_mileage_km,
       battery_pct, battery_updated_at,
       next_service_due_at, primary_showroom_id)
    VALUES
      (v_thana, m_j7, 'ขาวมุก', 'ขข 5678 นบ', 'LGXJ07' || substr(md5(v_thana::text),1,10),
       '2025-10-22', '2030-10-22', 14250,
       78, now() - interval '6 hours',
       '2026-05-22 14:00:00+07', sr_bangna)
    ON CONFLICT (vin) DO UPDATE SET
      color = EXCLUDED.color,
      license_plate = EXCLUDED.license_plate
    RETURNING id INTO veh_thana;

    INSERT INTO sena_ev.insurance_policies
      (vehicle_id, provider, class, policy_no, valid_from, valid_to, premium_baht)
    VALUES
      (veh_thana, 'กรุงเทพประกันภัย', '1',
       'B-2025-' || substr(md5(veh_thana::text),1,8),
       '2025-10-22', '2026-10-21', 22000)
    ON CONFLICT DO NOTHING;
  END IF;
END$$;

-- ─── Backfill car_model prices (เริ่มจาก market reference) ───
UPDATE sena_ev.car_models SET price_baht = 949000  WHERE slug = 'omoda-c5'      AND price_baht IS NULL;
UPDATE sena_ev.car_models SET price_baht = 879000  WHERE slug = 'jaecoo-j5-ev'  AND price_baht IS NULL;
UPDATE sena_ev.car_models SET price_baht = 999000  WHERE slug = 'jaecoo-j6'     AND price_baht IS NULL;
UPDATE sena_ev.car_models SET price_baht = 1199000 WHERE slug = 'jaecoo-j7'     AND price_baht IS NULL;
UPDATE sena_ev.car_models SET price_baht = 499000  WHERE slug = 'deepal-lumin'  AND price_baht IS NULL;
UPDATE sena_ev.car_models SET price_baht = 1299000 WHERE slug = 'deepal-e07'    AND price_baht IS NULL;
UPDATE sena_ev.car_models SET price_baht = 1099000 WHERE slug = 'deepal-l07'    AND price_baht IS NULL;
UPDATE sena_ev.car_models SET price_baht = 869000  WHERE slug = 'deepal-s05'    AND price_baht IS NULL;
UPDATE sena_ev.car_models SET price_baht = 1059000 WHERE slug = 'deepal-s07'    AND price_baht IS NULL;
UPDATE sena_ev.car_models SET price_baht = 999000  WHERE slug = 'deepal-hunter' AND price_baht IS NULL;
UPDATE sena_ev.car_models SET price_baht = 729000  WHERE slug = 'leapmotor-b10' AND price_baht IS NULL;
UPDATE sena_ev.car_models SET price_baht = 879000  WHERE slug = 'leapmotor-c10' AND price_baht IS NULL;

-- ─── Seed notifications for OWNER customers (so LIFF inbox has data) ───
INSERT INTO sena_ev.notifications (customer_id, type, title, body, sent_at, read_at)
SELECT c.id, 'service_reminder',
       'นัดเซอร์วิสพรุ่งนี้',
       'เวลา 10:00 น. ที่ Sena Service Bangna — อย่าลืมนำสมุดประกันมาด้วย',
       now() - interval '5 minutes', NULL
FROM sena_ev.customers c
WHERE c.state = 'OWNER'
  AND NOT EXISTS (
    SELECT 1 FROM sena_ev.notifications n
     WHERE n.customer_id = c.id AND n.type = 'service_reminder'
  );

INSERT INTO sena_ev.notifications (customer_id, type, title, body, sent_at, read_at)
SELECT c.id, 'promo',
       'โปรโมชั่นใหม่',
       'ส่วนลดประกันชั้น 1 30% ถึงสิ้นเดือนนี้',
       now() - interval '2 hours', NULL
FROM sena_ev.customers c
WHERE c.state IN ('OWNER','LEAD')
  AND NOT EXISTS (
    SELECT 1 FROM sena_ev.notifications n
     WHERE n.customer_id = c.id AND n.type = 'promo'
  );

INSERT INTO sena_ev.notifications (customer_id, type, title, body, sent_at, read_at)
SELECT c.id, 'system',
       'ยินดีต้อนรับ',
       'ขอบคุณที่เป็นลูกค้า Sena EV — มีอะไรช่วยเหลือสอบถามได้ตลอด 24 ชม.',
       now() - interval '1 day', now() - interval '23 hours'
FROM sena_ev.customers c
WHERE NOT EXISTS (
  SELECT 1 FROM sena_ev.notifications n
   WHERE n.customer_id = c.id AND n.type = 'system'
);
