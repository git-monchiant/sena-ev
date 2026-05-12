import { NextResponse } from "next/server";
import {
  getAvailabilityForDate,
  getAvailabilityForMonth,
} from "@/lib/booking-availability";
import { SCHEDULE_TYPES, type ScheduleType } from "@/lib/schedules";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const showroomSlug = url.searchParams.get("showroomSlug");
  const dateStr = url.searchParams.get("date");
  const fromStr = url.searchParams.get("from");
  const toStr = url.searchParams.get("to");
  const typeStr = url.searchParams.get("type") ?? "service";

  if (!showroomSlug) {
    return NextResponse.json(
      { error: "showroomSlug is required" },
      { status: 400 },
    );
  }
  const type = SCHEDULE_TYPES.includes(typeStr as ScheduleType)
    ? (typeStr as ScheduleType)
    : "service";

  // Month-range query
  if (fromStr && toStr) {
    const from = new Date(fromStr);
    const to = new Date(toStr);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      return NextResponse.json({ error: "invalid date" }, { status: 400 });
    }
    const map = await getAvailabilityForMonth({
      showroomSlug,
      from,
      to,
      type,
    });
    return NextResponse.json({ map });
  }

  // Single-date query
  if (!dateStr) {
    return NextResponse.json(
      { error: "date or from/to is required" },
      { status: 400 },
    );
  }
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) {
    return NextResponse.json({ error: "invalid date" }, { status: 400 });
  }
  const r = await getAvailabilityForDate({ showroomSlug, date, type });
  return NextResponse.json(r);
}
