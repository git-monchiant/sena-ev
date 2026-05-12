import { NextResponse } from "next/server";
import { getCustomerByLineUserId } from "@/lib/customer-state";
import {
  listByFilter,
  SCHEDULE_TYPES,
  type ScheduleType,
} from "@/lib/schedules";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const lineUserId = url.searchParams.get("lineUserId");
  const typeStr = url.searchParams.get("type");
  if (!lineUserId) {
    return NextResponse.json(
      { error: "lineUserId is required" },
      { status: 400 },
    );
  }
  if (!typeStr || !SCHEDULE_TYPES.includes(typeStr as ScheduleType)) {
    return NextResponse.json(
      { error: `type must be one of ${SCHEDULE_TYPES.join(", ")}` },
      { status: 400 },
    );
  }
  const type = typeStr as ScheduleType;

  const customer = await getCustomerByLineUserId(lineUserId);
  if (!customer) {
    return NextResponse.json({ booking: null });
  }

  const rows = await listByFilter({
    customerId: customer.id,
    type,
    from: new Date(),
  });
  const open = rows.find(
    (s) =>
      s.status === "NEW" ||
      s.status === "CONFIRMED" ||
      s.status === "IN_PROGRESS",
  );
  if (!open) return NextResponse.json({ booking: null });

  return NextResponse.json({
    booking: {
      id: open.id,
      type: open.type,
      subtype: open.subtype,
      title: open.title,
      scheduledAt: open.scheduled_at,
      durationMinutes: open.duration_minutes,
      location: open.location,
      status: open.status,
      notes: open.notes,
      payload: open.payload,
    },
  });
}
