import { NextResponse } from "next/server";
import { getCustomerByLineUserId } from "@/lib/customer-state";
import { pushBookingCancellation } from "@/lib/line/booking-flex";
import { getById, update } from "@/lib/schedules";
import { query } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as {
    lineUserId?: string;
    reason?: string;
  };
  if (!body.lineUserId) {
    return NextResponse.json(
      { error: "lineUserId is required" },
      { status: 400 },
    );
  }

  const customer = await getCustomerByLineUserId(body.lineUserId);
  if (!customer) {
    return NextResponse.json(
      { error: "ไม่พบบัญชีลูกค้า" },
      { status: 404 },
    );
  }

  const schedule = await getById(id);
  if (!schedule) {
    return NextResponse.json({ error: "ไม่พบรายการจอง" }, { status: 404 });
  }
  if (schedule.customer_id !== customer.id) {
    return NextResponse.json(
      { error: "ไม่มีสิทธิ์ยกเลิกรายการนี้" },
      { status: 403 },
    );
  }
  if (
    schedule.status !== "NEW" &&
    schedule.status !== "CONFIRMED" &&
    schedule.status !== "IN_PROGRESS"
  ) {
    return NextResponse.json(
      { error: "รายการนี้ปิดไปแล้ว ไม่สามารถยกเลิกได้" },
      { status: 409 },
    );
  }

  const updated = await update(id, {
    status: "CANCELLED",
    cancelReason: body.reason ?? "ยกเลิกโดยลูกค้า",
  });

  // Push cancellation Flex + save to admin inbox (best-effort)
  if (updated && (updated.type === "service" || updated.type === "test_drive")) {
    try {
      let showroomLat: number | null = null;
      let showroomLng: number | null = null;
      let showroomGmapUrl: string | null = null;
      let showroomAddress: string | null = null;

      if (updated.showroom_id) {
        const r = await query<{
          slug: string;
          address: string;
          lat: string | null;
          lng: string | null;
          gmap_url: string | null;
        }>(
          `SELECT slug, address, lat, lng, gmap_url
             FROM sena_ev.showrooms WHERE id = $1 LIMIT 1`,
          [updated.showroom_id],
        );
        const row = r.rows[0];
        if (row) {
          showroomAddress = row.address;
          showroomLat = row.lat == null ? null : Number(row.lat);
          showroomLng = row.lng == null ? null : Number(row.lng);
          showroomGmapUrl = row.gmap_url;
        }
      }

      await pushBookingCancellation(body.lineUserId, customer.id, {
        type: updated.type as "service" | "test_drive",
        subtype: updated.subtype,
        title: updated.title,
        scheduledAt: new Date(updated.scheduled_at),
        durationMinutes: updated.duration_minutes,
        location: updated.location ?? "",
        showroomAddress,
        showroomLat,
        showroomLng,
        showroomGmapUrl,
        notes: updated.notes,
        modelName:
          (updated.payload?.model_name as string | undefined) ?? null,
        mileageKm:
          (updated.payload?.mileage_km as number | undefined) ?? null,
        scheduleId: updated.id,
      });
    } catch (err) {
      console.error("[booking] push cancel flex failed", err);
    }
  }

  return NextResponse.json({ ok: true, schedule: updated });
}
