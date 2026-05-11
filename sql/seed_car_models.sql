-- ====================================================
-- SEED: car_models from https://senagreenauto.co.th/
-- Source: data/catalog.json (fetched 2026-05-11)
-- Re-runnable: uses ON CONFLICT (slug)
-- ====================================================

BEGIN;

INSERT INTO sena_ev.car_models (slug, name, brand, body_type, brochure_url, sort_order)
VALUES
  -- OMODA & JAECOO (sort 100-199)
  ('omoda-c5',      'OMODA C5',      'OMODA',    'SUV Coupe',
   'https://senagreenauto.co.th/wp-content/uploads/2026/04/LO_AW_Leaflet_C5_EV_cd8b91f484_ffed810e2a.pdf',
   101),
  ('jaecoo-j5-ev',  'JAECOO 5 EV',   'JAECOO',   'SUV',
   'https://senagreenauto.co.th/wp-content/uploads/2026/04/Leaflet_Jaecoo_5_EV_Max_1bc53f609a.pdf',
   102),
  ('jaecoo-j6',     'JAECOO J6',     'JAECOO',   'SUV',
   'https://senagreenauto.co.th/wp-content/uploads/2026/04/Brochure_J6_EV_2025_11_27_8b9b5030e8.pdf',
   103),
  ('jaecoo-j7',     'JAECOO J7',     'JAECOO',   'SUV',
   'https://senagreenauto.co.th/wp-content/uploads/2026/04/J7_Brochure_99b99c0d9c.pdf',
   104),

  -- DEEPAL (sort 200-299)
  ('deepal-lumin',  'LUMIN',         'DEEPAL',   'City EV (mini hatchback)', NULL, 201),
  ('deepal-e07',    'DEEPAL E07',    'DEEPAL',   'SUV / Pickup convertible', NULL, 202),
  ('deepal-l07',    'DEEPAL L07',    'DEEPAL',   'Sedan',                    NULL, 203),
  ('deepal-s05',    'DEEPAL S05',    'DEEPAL',   'SUV',                      NULL, 204),
  ('deepal-s07',    'DEEPAL S07',    'DEEPAL',   'SUV',                      NULL, 205),
  ('deepal-hunter', 'HUNTER',        'DEEPAL',   'Pickup',                   NULL, 206),

  -- LEAPMOTOR (sort 300-399)
  ('leapmotor-b10', 'LEAPMOTOR B10', 'LEAPMOTOR', 'SUV (compact)',  NULL, 301),
  ('leapmotor-c10', 'LEAPMOTOR C10', 'LEAPMOTOR', 'SUV (mid-size)', NULL, 302)
ON CONFLICT (slug) DO UPDATE
  SET name         = EXCLUDED.name,
      brand        = EXCLUDED.brand,
      body_type    = EXCLUDED.body_type,
      brochure_url = COALESCE(EXCLUDED.brochure_url, sena_ev.car_models.brochure_url),
      sort_order   = EXCLUDED.sort_order,
      updated_at   = now();

COMMIT;

-- ----------------------------------------------------
-- Verify
-- ----------------------------------------------------
SELECT brand, name, body_type,
       CASE WHEN brochure_url IS NOT NULL THEN 'yes' ELSE '—' END AS brochure,
       CASE WHEN price_baht IS NOT NULL THEN price_baht::text ELSE '—' END AS price
FROM sena_ev.car_models
ORDER BY sort_order;
