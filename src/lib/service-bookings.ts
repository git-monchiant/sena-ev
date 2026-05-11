import "server-only";
import { query, queryOne } from "./db";

export type ServiceType = "maintenance" | "repair" | "inspection";
export type BookingStatus = "NEW" | "CONFIRMED" | "DONE" | "CANCELLED";

export type ServiceBookingRow = {
  id: string;
  customer_id: string;
  vehicle_id: string | null;
  service_type: ServiceType;
  scheduled_at: Date;
  service_center: string | null;
  status: BookingStatus;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
};

export async function listByCustomer(
  customerId: string,
): Promise<ServiceBookingRow[]> {
  const result = await query<ServiceBookingRow>(
    `SELECT id, customer_id, vehicle_id, service_type, scheduled_at,
            service_center, status, notes, created_at, updated_at
     FROM sena_ev.service_bookings
     WHERE customer_id = $1
     ORDER BY scheduled_at DESC`,
    [customerId],
  );
  return result.rows;
}

export async function getById(id: string): Promise<ServiceBookingRow | null> {
  return queryOne<ServiceBookingRow>(
    `SELECT id, customer_id, vehicle_id, service_type, scheduled_at,
            service_center, status, notes, created_at, updated_at
     FROM sena_ev.service_bookings
     WHERE id = $1`,
    [id],
  );
}

export async function create(params: {
  customerId: string;
  serviceType: ServiceType;
  scheduledAt: Date;
  serviceCenter?: string;
  notes?: string;
  status?: BookingStatus;
}): Promise<ServiceBookingRow> {
  const row = await queryOne<ServiceBookingRow>(
    `INSERT INTO sena_ev.service_bookings
       (customer_id, service_type, scheduled_at, service_center, notes, status)
     VALUES ($1, $2, $3, $4, $5, COALESCE($6, 'NEW'))
     RETURNING id, customer_id, vehicle_id, service_type, scheduled_at,
               service_center, status, notes, created_at, updated_at`,
    [
      params.customerId,
      params.serviceType,
      params.scheduledAt.toISOString(),
      params.serviceCenter ?? null,
      params.notes ?? null,
      params.status ?? null,
    ],
  );
  if (!row) throw new Error("create service_booking failed");
  return row;
}

export async function update(
  id: string,
  patch: {
    serviceType?: ServiceType;
    scheduledAt?: Date;
    serviceCenter?: string | null;
    notes?: string | null;
    status?: BookingStatus;
  },
): Promise<ServiceBookingRow | null> {
  const sets: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (patch.serviceType !== undefined) {
    sets.push(`service_type = $${idx++}`);
    values.push(patch.serviceType);
  }
  if (patch.scheduledAt !== undefined) {
    sets.push(`scheduled_at = $${idx++}`);
    values.push(patch.scheduledAt.toISOString());
  }
  if (patch.serviceCenter !== undefined) {
    sets.push(`service_center = $${idx++}`);
    values.push(patch.serviceCenter);
  }
  if (patch.notes !== undefined) {
    sets.push(`notes = $${idx++}`);
    values.push(patch.notes);
  }
  if (patch.status !== undefined) {
    sets.push(`status = $${idx++}`);
    values.push(patch.status);
  }

  if (sets.length === 0) return getById(id);

  values.push(id);
  const row = await queryOne<ServiceBookingRow>(
    `UPDATE sena_ev.service_bookings
     SET ${sets.join(", ")}
     WHERE id = $${idx}
     RETURNING id, customer_id, vehicle_id, service_type, scheduled_at,
               service_center, status, notes, created_at, updated_at`,
    values,
  );
  return row;
}

export async function cancel(id: string): Promise<ServiceBookingRow | null> {
  return update(id, { status: "CANCELLED" });
}

export async function remove(id: string): Promise<void> {
  await query(`DELETE FROM sena_ev.service_bookings WHERE id = $1`, [id]);
}
