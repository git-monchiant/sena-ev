import { NextResponse } from "next/server";
import {
  create,
  listByCustomer,
  SCHEDULE_STATUSES,
  SCHEDULE_TYPES,
  type ScheduleStatus,
  type ScheduleType,
} from "@/lib/schedules";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SERVICE_SUBTYPES = new Set([
  "maintenance",
  "repair",
  "inspection",
  "body_shop",
  "tire",
]);

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const rows = await listByCustomer(id);
  return NextResponse.json({ appointments: rows });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await req.json()) as {
    type?: string;
    subtype?: string;
    serviceType?: string;
    title?: string;
    scheduledAt?: string;
    durationMinutes?: number;
    showroomId?: string;
    serviceCenter?: string;
    location?: string;
    notes?: string;
    status?: string;
    sourceMessageId?: string;
    conversationId?: string;
    vehicleId?: string;
    payload?: Record<string, unknown>;
  };

  // Accept legacy `serviceType` (treat as subtype) or explicit `type`+`subtype`.
  let type: ScheduleType;
  let subtype: string | null = null;
  if (body.type) {
    if (!SCHEDULE_TYPES.includes(body.type as ScheduleType)) {
      return NextResponse.json(
        { error: `type must be one of ${SCHEDULE_TYPES.join(", ")}` },
        { status: 400 },
      );
    }
    type = body.type as ScheduleType;
    subtype = body.subtype ?? null;
  } else if (body.serviceType) {
    if (!SERVICE_SUBTYPES.has(body.serviceType)) {
      return NextResponse.json(
        {
          error: `serviceType must be one of ${[...SERVICE_SUBTYPES].join(", ")}`,
        },
        { status: 400 },
      );
    }
    type = "service";
    subtype = body.serviceType;
  } else {
    return NextResponse.json(
      { error: "type (or serviceType) is required" },
      { status: 400 },
    );
  }

  if (!body.scheduledAt) {
    return NextResponse.json(
      { error: "scheduledAt required (ISO 8601)" },
      { status: 400 },
    );
  }
  const scheduledAt = new Date(body.scheduledAt);
  if (Number.isNaN(scheduledAt.getTime())) {
    return NextResponse.json(
      { error: "scheduledAt is not a valid date" },
      { status: 400 },
    );
  }
  if (body.status && !SCHEDULE_STATUSES.includes(body.status as ScheduleStatus)) {
    return NextResponse.json(
      { error: `status must be one of ${SCHEDULE_STATUSES.join(", ")}` },
      { status: 400 },
    );
  }

  const title =
    body.title?.trim() ||
    defaultTitle(type, subtype) ||
    "งานนัด";

  const appointment = await create({
    type,
    subtype,
    title,
    scheduledAt,
    durationMinutes: body.durationMinutes,
    showroomId: body.showroomId ?? null,
    location: body.location ?? body.serviceCenter ?? null,
    customerId: id,
    vehicleId: body.vehicleId ?? null,
    conversationId: body.conversationId ?? null,
    sourceMessageId: body.sourceMessageId ?? null,
    status: body.status as ScheduleStatus | undefined,
    notes: body.notes,
    payload: body.payload ?? {},
  });

  return NextResponse.json({ appointment }, { status: 201 });
}

function defaultTitle(type: ScheduleType, subtype: string | null): string {
  if (type === "service") {
    switch (subtype) {
      case "maintenance":
        return "เช็คระยะ";
      case "repair":
        return "ซ่อม";
      case "inspection":
        return "ตรวจสภาพ";
      case "body_shop":
        return "ซ่อมสีและตัวถัง";
      case "tire":
        return "บริการยาง/ล้อ";
      default:
        return "เซอร์วิส";
    }
  }
  if (type === "test_drive") return "ทดลองขับ";
  if (type === "follow_up") return "ติดตามลูกค้า";
  if (type === "callback") return "โทรกลับ";
  if (type === "document_delivery") return "ส่งเอกสาร";
  if (type === "internal_task") return "งานภายใน";
  if (type === "reminder") return "แจ้งเตือน";
  return "งานนัด";
}
