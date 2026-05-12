-- ====================================================
-- Seed: car_models.spec (range, battery, power) per model
-- Reference: manufacturer published specs (market reference)
-- ====================================================

UPDATE sena_ev.car_models SET spec = jsonb_build_object(
  'range_km', 450, 'battery_kwh', 64, 'motor_kw', 150, 'motor_hp', 204,
  'zero_to_hundred_s', 7.6, 'top_speed_kmh', 172,
  'charging_ac_kw', 7.4, 'charging_dc_kw', 80
) WHERE slug = 'omoda-c5';

UPDATE sena_ev.car_models SET spec = jsonb_build_object(
  'range_km', 401, 'battery_kwh', 60, 'motor_kw', 155, 'motor_hp', 211,
  'zero_to_hundred_s', 6.7, 'top_speed_kmh', 172,
  'charging_ac_kw', 7.4, 'charging_dc_kw', 80
) WHERE slug = 'jaecoo-j5-ev';

UPDATE sena_ev.car_models SET spec = jsonb_build_object(
  'range_km', 502, 'battery_kwh', 70, 'motor_kw', 165, 'motor_hp', 224,
  'zero_to_hundred_s', 7.8, 'top_speed_kmh', 175,
  'charging_ac_kw', 7.4, 'charging_dc_kw', 90
) WHERE slug = 'jaecoo-j6';

UPDATE sena_ev.car_models SET spec = jsonb_build_object(
  'range_km', 540, 'battery_kwh', 82, 'motor_kw', 200, 'motor_hp', 272,
  'zero_to_hundred_s', 6.5, 'top_speed_kmh', 180,
  'charging_ac_kw', 11, 'charging_dc_kw', 100
) WHERE slug = 'jaecoo-j7';

UPDATE sena_ev.car_models SET spec = jsonb_build_object(
  'range_km', 210, 'battery_kwh', 32, 'motor_kw', 70, 'motor_hp', 95,
  'zero_to_hundred_s', 11.5, 'top_speed_kmh', 130,
  'charging_ac_kw', 6.6, 'charging_dc_kw', 40
) WHERE slug = 'deepal-lumin';

UPDATE sena_ev.car_models SET spec = jsonb_build_object(
  'range_km', 660, 'battery_kwh', 95, 'motor_kw', 230, 'motor_hp', 313,
  'zero_to_hundred_s', 5.7, 'top_speed_kmh', 190,
  'charging_ac_kw', 11, 'charging_dc_kw', 120
) WHERE slug = 'deepal-e07';

UPDATE sena_ev.car_models SET spec = jsonb_build_object(
  'range_km', 555, 'battery_kwh', 79, 'motor_kw', 190, 'motor_hp', 258,
  'zero_to_hundred_s', 6.5, 'top_speed_kmh', 185,
  'charging_ac_kw', 11, 'charging_dc_kw', 100
) WHERE slug = 'deepal-l07';

UPDATE sena_ev.car_models SET spec = jsonb_build_object(
  'range_km', 480, 'battery_kwh', 65, 'motor_kw', 160, 'motor_hp', 218,
  'zero_to_hundred_s', 7.2, 'top_speed_kmh', 180,
  'charging_ac_kw', 11, 'charging_dc_kw', 80
) WHERE slug = 'deepal-s05';

UPDATE sena_ev.car_models SET spec = jsonb_build_object(
  'range_km', 605, 'battery_kwh', 80, 'motor_kw', 190, 'motor_hp', 258,
  'zero_to_hundred_s', 6.8, 'top_speed_kmh', 185,
  'charging_ac_kw', 11, 'charging_dc_kw', 100
) WHERE slug = 'deepal-s07';

UPDATE sena_ev.car_models SET spec = jsonb_build_object(
  'range_km', 505, 'battery_kwh', 82, 'motor_kw', 175, 'motor_hp', 238,
  'zero_to_hundred_s', 8.5, 'top_speed_kmh', 170,
  'charging_ac_kw', 11, 'charging_dc_kw', 90
) WHERE slug = 'deepal-hunter';

UPDATE sena_ev.car_models SET spec = jsonb_build_object(
  'range_km', 510, 'battery_kwh', 68, 'motor_kw', 160, 'motor_hp', 218,
  'zero_to_hundred_s', 7.5, 'top_speed_kmh', 175,
  'charging_ac_kw', 11, 'charging_dc_kw', 90
) WHERE slug = 'leapmotor-b10';

UPDATE sena_ev.car_models SET spec = jsonb_build_object(
  'range_km', 580, 'battery_kwh', 85, 'motor_kw', 200, 'motor_hp', 272,
  'zero_to_hundred_s', 7.5, 'top_speed_kmh', 180,
  'charging_ac_kw', 11, 'charging_dc_kw', 100
) WHERE slug = 'leapmotor-c10';
