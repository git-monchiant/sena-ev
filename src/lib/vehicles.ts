import "server-only";
import { query, queryOne } from "./db";

export type Vehicle = {
  id: string;
  customerId: string;
  modelId: string | null;
  modelName: string | null;
  modelBrand: string | null;
  modelBatteryKwh: number | null;
  modelRangeKm: number | null;
  color: string | null;
  licensePlate: string | null;
  vin: string | null;
  deliveredAt: string | null;
  warrantyUntil: string | null;
  currentMileageKm: number | null;
  batteryPct: number | null;
  batteryUpdatedAt: string | null;
  lastServiceAt: string | null;
  nextServiceDueAt: string | null;
  primaryShowroomId: string | null;
  primaryShowroomName: string | null;
};

type Row = {
  id: string;
  customer_id: string;
  model_id: string | null;
  model_name: string | null;
  model_brand: string | null;
  model_battery_kwh: string | null;
  model_range_km: string | null;
  color: string | null;
  license_plate: string | null;
  vin: string | null;
  delivered_at: string | null;
  warranty_until: string | null;
  current_mileage_km: number | null;
  battery_pct: number | null;
  battery_updated_at: string | null;
  last_service_at: string | null;
  next_service_due_at: string | null;
  primary_showroom_id: string | null;
  primary_showroom_name: string | null;
};

function toVehicle(r: Row): Vehicle {
  return {
    id: r.id,
    customerId: r.customer_id,
    modelId: r.model_id,
    modelName: r.model_name,
    modelBrand: r.model_brand,
    modelBatteryKwh: r.model_battery_kwh == null ? null : Number(r.model_battery_kwh),
    modelRangeKm: r.model_range_km == null ? null : Number(r.model_range_km),
    color: r.color,
    licensePlate: r.license_plate,
    vin: r.vin,
    deliveredAt: r.delivered_at,
    warrantyUntil: r.warranty_until,
    currentMileageKm: r.current_mileage_km,
    batteryPct: r.battery_pct,
    batteryUpdatedAt: r.battery_updated_at,
    lastServiceAt: r.last_service_at,
    nextServiceDueAt: r.next_service_due_at,
    primaryShowroomId: r.primary_showroom_id,
    primaryShowroomName: r.primary_showroom_name,
  };
}

const SELECT_COLS = `v.id, v.customer_id, v.model_id,
  m.name AS model_name, m.brand AS model_brand,
  NULLIF(m.spec->>'battery_kwh','')::numeric AS model_battery_kwh,
  NULLIF(m.spec->>'range_km','')::numeric    AS model_range_km,
  v.color, v.license_plate, v.vin,
  v.delivered_at::text, v.warranty_until::text,
  v.current_mileage_km, v.battery_pct,
  v.battery_updated_at::text,
  v.last_service_at::text, v.next_service_due_at::text,
  v.primary_showroom_id,
  s.short_name AS primary_showroom_name`;

export async function listByCustomer(customerId: string): Promise<Vehicle[]> {
  const r = await query<Row>(
    `SELECT ${SELECT_COLS}
       FROM sena_ev.vehicles v
       LEFT JOIN sena_ev.car_models m ON m.id = v.model_id
       LEFT JOIN sena_ev.showrooms s  ON s.id = v.primary_showroom_id
      WHERE v.customer_id = $1 AND v.is_active = true
      ORDER BY v.created_at DESC`,
    [customerId],
  );
  return r.rows.map(toVehicle);
}

export async function getPrimaryVehicle(
  customerId: string,
): Promise<Vehicle | null> {
  const rows = await listByCustomer(customerId);
  return rows[0] ?? null;
}

export type InsurancePolicy = {
  id: string;
  vehicleId: string;
  provider: string;
  class: string;
  policyNo: string | null;
  validFrom: string | null;
  validTo: string | null;
  premiumBaht: number | null;
};

type PolicyRow = {
  id: string;
  vehicle_id: string;
  provider: string;
  class: string;
  policy_no: string | null;
  valid_from: string | null;
  valid_to: string | null;
  premium_baht: string | null;
};

export async function getActivePolicy(
  vehicleId: string,
): Promise<InsurancePolicy | null> {
  const r = await queryOne<PolicyRow>(
    `SELECT id, vehicle_id, provider, class, policy_no,
            valid_from::text, valid_to::text, premium_baht
       FROM sena_ev.insurance_policies
      WHERE vehicle_id = $1
        AND (valid_to IS NULL OR valid_to >= CURRENT_DATE)
      ORDER BY valid_from DESC NULLS LAST
      LIMIT 1`,
    [vehicleId],
  );
  if (!r) return null;
  return {
    id: r.id,
    vehicleId: r.vehicle_id,
    provider: r.provider,
    class: r.class,
    policyNo: r.policy_no,
    validFrom: r.valid_from,
    validTo: r.valid_to,
    premiumBaht: r.premium_baht == null ? null : Number(r.premium_baht),
  };
}
