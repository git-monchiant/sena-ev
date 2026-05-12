import { NextResponse } from "next/server";
import {
  countBookedAt,
  create,
  listByFilter,
  type ScheduleType,
} from "@/lib/schedules";
import { getCustomerByLineUserId } from "@/lib/customer-state";
import { getCarModelBySlug } from "@/lib/car-models";
import { getShowroomBySlug } from "@/lib/showrooms";
import { getPrimaryVehicle } from "@/lib/vehicles";
import { pushBookingConfirmation } from "@/lib/line/booking-flex";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  lineUserId?: string;
  type?: ScheduleType;
  subtype?: string;
  showroomSlug?: string;
  date?: string; // YYYY-MM-DD
  time?: string; // HH:mm
  notes?: string;
  phone?: string;
  modelSlug?: string;
  mileageKm?: number;
  batteryKwh?: number;
};

const SLOT_MINUTES = 60;
const CAPACITY_PER_SLOT = 3;

export async function POST(req: Request) {
  const body = (await req.json()) as Body;

  if (!body.lineUserId) {
    return NextResponse.json(
      { error: "lineUserId is required" },
      { status: 400 },
    );
  }
  if (body.type !== "service" && body.type !== "test_drive") {
    return NextResponse.json(
      { error: "type must be 'service' or 'test_drive'" },
      { status: 400 },
    );
  }
  if (!body.showroomSlug) {
    return NextResponse.json(
      { error: "showroomSlug is required" },
      { status: 400 },
    );
  }
  if (!body.date || !body.time) {
    return NextResponse.json(
      { error: "date and time are required" },
      { status: 400 },
    );
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
    return NextResponse.json({ error: "invalid date" }, { status: 400 });
  }
  if (!/^\d{2}:\d{2}$/.test(body.time)) {
    return NextResponse.json({ error: "invalid time" }, { status: 400 });
  }

  const scheduledAt = new Date(`${body.date}T${body.time}:00+07:00`);
  if (Number.isNaN(scheduledAt.getTime())) {
    return NextResponse.json({ error: "invalid datetime" }, { status: 400 });
  }
  if (scheduledAt.getTime() < Date.now()) {
    return NextResponse.json(
      { error: "เลือกเวลาที่อยู่ในอนาคต" },
      { status: 400 },
    );
  }

  const showroom = await getShowroomBySlug(body.showroomSlug);
  if (!showroom || !showroom.isActive) {
    return NextResponse.json(
      { error: "ไม่พบโชว์รูมที่เลือก" },
      { status: 404 },
    );
  }

  // Capacity check
  const to = new Date(scheduledAt.getTime() + SLOT_MINUTES * 60 * 1000);
  const booked = await countBookedAt({
    showroomId: showroom.id,
    from: scheduledAt,
    to,
    type: body.type,
  });
  if (booked >= CAPACITY_PER_SLOT) {
    return NextResponse.json(
      { error: "ช่วงเวลานี้เต็มแล้ว กรุณาเลือกเวลาอื่น" },
      { status: 409 },
    );
  }

  // Resolve customer (must exist — created on first LINE follow)
  const customer = await getCustomerByLineUserId(body.lineUserId);
  if (!customer) {
    return NextResponse.json(
      { error: "ไม่พบบัญชีลูกค้า กรุณาเพิ่มเพื่อน OA Sena EV ก่อน" },
      { status: 404 },
    );
  }

  // One active booking per type
  const existing = await listByFilter({
    customerId: customer.id,
    type: body.type,
    from: new Date(),
  });
  const stillOpen = existing.find(
    (s) =>
      s.status === "NEW" ||
      s.status === "CONFIRMED" ||
      s.status === "IN_PROGRESS",
  );
  if (stillOpen) {
    return NextResponse.json(
      {
        error: "มีการจองที่ยังไม่เสร็จสิ้น กรุณายกเลิกก่อนทำการจองใหม่",
        existingScheduleId: stillOpen.id,
      },
      { status: 409 },
    );
  }

  // Update customer phone if provided
  if (body.phone && body.phone !== customer.phone) {
    // best-effort; ignore failure
    try {
      const { query } = await import("@/lib/db");
      await query(
        `UPDATE sena_ev.customers SET phone = $1 WHERE id = $2`,
        [body.phone.trim(), customer.id],
      );
    } catch {
      /* noop */
    }
  }

  // Build payload + title per type
  let title = "งานนัด";
  let subtype: string | null = null;
  const payload: Record<string, unknown> = {};
  let vehicleId: string | null = null;

  if (body.type === "service") {
    const validSubtypes = new Set([
      "maintenance",
      "repair",
      "inspection",
      "body_shop",
      "tire",
    ]);
    subtype = body.subtype && validSubtypes.has(body.subtype) ? body.subtype : "maintenance";
    title = SERVICE_TITLE[subtype] ?? "เซอร์วิส";
    payload.service_center = showroom.shortName ?? showroom.name;

    // Mileage required for maintenance
    if (subtype === "maintenance") {
      if (
        body.mileageKm == null ||
        !Number.isFinite(body.mileageKm) ||
        body.mileageKm < 0 ||
        body.mileageKm > 999_999
      ) {
        return NextResponse.json(
          { error: "กรอกเลขไมล์ปัจจุบัน (กม.)" },
          { status: 400 },
        );
      }
      payload.mileage_km = Math.round(body.mileageKm);
    } else if (body.mileageKm != null && Number.isFinite(body.mileageKm)) {
      payload.mileage_km = Math.round(body.mileageKm);
    }

    // User-supplied battery overrides; else fall back to vehicle's
    if (body.batteryKwh != null && Number.isFinite(body.batteryKwh)) {
      payload.battery_kwh = Number(body.batteryKwh);
    }

    // Attach primary vehicle if OWNER has one + update mileage
    const vehicle = await getPrimaryVehicle(customer.id);
    if (vehicle) {
      vehicleId = vehicle.id;
      if (vehicle.modelName) {
        payload.model_name = `${vehicle.modelBrand ?? ""} ${vehicle.modelName}`.trim();
      }
      if (payload.battery_kwh == null && vehicle.modelBatteryKwh != null) {
        payload.battery_kwh = vehicle.modelBatteryKwh;
      }
      if (typeof payload.mileage_km === "number") {
        try {
          const { query } = await import("@/lib/db");
          await query(
            `UPDATE sena_ev.vehicles
                SET current_mileage_km = GREATEST(COALESCE(current_mileage_km, 0), $1)
              WHERE id = $2`,
            [payload.mileage_km, vehicle.id],
          );
        } catch {
          /* noop */
        }
      }
    }
  } else {
    // test_drive
    title = "ทดลองขับ";
    if (body.modelSlug) {
      const model = await getCarModelBySlug(body.modelSlug);
      if (model) {
        payload.model_slug = model.slug;
        payload.model_name = model.name;
        title = `ทดลองขับ ${model.name}`;
      }
    }
    if (body.phone) payload.phone = body.phone;
  }

  const schedule = await create({
    type: body.type,
    subtype,
    title,
    scheduledAt,
    durationMinutes: SLOT_MINUTES,
    showroomId: showroom.id,
    location: showroom.name,
    customerId: customer.id,
    vehicleId,
    status: "NEW",
    payload,
    notes: body.notes ?? null,
  });

  // Push Flex confirmation to LINE + save outbound message (best-effort)
  try {
    await pushBookingConfirmation(body.lineUserId, customer.id, {
      type: body.type,
      subtype,
      title,
      scheduledAt,
      location: showroom.name,
      showroomAddress: showroom.address,
      showroomLat: showroom.lat,
      showroomLng: showroom.lng,
      showroomGmapUrl: showroom.gmapUrl,
      notes: body.notes ?? null,
      modelName: payload.model_name as string | undefined,
      mileageKm: payload.mileage_km as number | undefined,
      scheduleId: schedule.id,
    });
  } catch (err) {
    console.error("[booking] push flex failed", err);
  }

  return NextResponse.json({ schedule }, { status: 201 });
}

const SERVICE_TITLE: Record<string, string> = {
  maintenance: "เช็คระยะ",
  repair: "ซ่อม",
  inspection: "ตรวจสภาพ",
  body_shop: "ซ่อมสีและตัวถัง",
  tire: "บริการยาง/ล้อ",
};
