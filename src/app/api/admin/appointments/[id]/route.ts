import { NextResponse } from "next/server";
import {
  getById,
  remove,
  SCHEDULE_STATUSES,
  SCHEDULE_TYPES,
  update,
  type ScheduleStatus,
  type ScheduleType,
  type UpdateSchedulePatch,
} from "@/lib/schedules";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const appointment = await getById(id);
  if (!appointment) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json({ appointment });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await req.json()) as {
    type?: string;
    subtype?: string | null;
    title?: string;
    scheduledAt?: string;
    durationMinutes?: number;
    showroomId?: string | null;
    location?: string | null;
    notes?: string | null;
    status?: string;
    serviceType?: string;
    serviceCenter?: string | null;
    cancelReason?: string | null;
    payload?: Record<string, unknown>;
  };

  const patch: UpdateSchedulePatch = {};

  if (body.type !== undefined) {
    if (!SCHEDULE_TYPES.includes(body.type as ScheduleType)) {
      return NextResponse.json(
        { error: `type must be one of ${SCHEDULE_TYPES.join(", ")}` },
        { status: 400 },
      );
    }
    patch.type = body.type as ScheduleType;
  }
  if (body.subtype !== undefined) patch.subtype = body.subtype;
  if (body.title !== undefined) patch.title = body.title;
  if (body.scheduledAt !== undefined) {
    const d = new Date(body.scheduledAt);
    if (Number.isNaN(d.getTime())) {
      return NextResponse.json(
        { error: "scheduledAt is not a valid date" },
        { status: 400 },
      );
    }
    patch.scheduledAt = d;
  }
  if (body.durationMinutes !== undefined)
    patch.durationMinutes = body.durationMinutes;
  if (body.showroomId !== undefined) patch.showroomId = body.showroomId;
  if (body.location !== undefined) patch.location = body.location;
  if (body.notes !== undefined) patch.notes = body.notes;
  if (body.cancelReason !== undefined) patch.cancelReason = body.cancelReason;
  if (body.payload !== undefined) patch.payload = body.payload;
  if (body.status !== undefined) {
    if (!SCHEDULE_STATUSES.includes(body.status as ScheduleStatus)) {
      return NextResponse.json(
        { error: `status must be one of ${SCHEDULE_STATUSES.join(", ")}` },
        { status: 400 },
      );
    }
    patch.status = body.status as ScheduleStatus;
  }

  // legacy field mapping
  if (body.serviceType !== undefined && body.subtype === undefined) {
    patch.subtype = body.serviceType;
    if (!patch.type) patch.type = "service";
  }
  if (body.serviceCenter !== undefined && body.location === undefined) {
    patch.location = body.serviceCenter;
  }

  const updated = await update(id, patch);
  if (!updated) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json({ appointment: updated });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await remove(id);
  return NextResponse.json({ ok: true });
}
