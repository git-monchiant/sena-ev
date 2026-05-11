import { NextResponse } from "next/server";
import {
  getById,
  remove,
  update,
  type BookingStatus,
  type ServiceType,
} from "@/lib/service-bookings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SERVICE_TYPES: ServiceType[] = ["maintenance", "repair", "inspection"];
const STATUSES: BookingStatus[] = ["NEW", "CONFIRMED", "DONE", "CANCELLED"];

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
    serviceType?: string;
    scheduledAt?: string;
    serviceCenter?: string | null;
    notes?: string | null;
    status?: string;
  };

  const patch: Parameters<typeof update>[1] = {};

  if (body.serviceType !== undefined) {
    if (!SERVICE_TYPES.includes(body.serviceType as ServiceType)) {
      return NextResponse.json(
        { error: `serviceType must be one of ${SERVICE_TYPES.join(", ")}` },
        { status: 400 },
      );
    }
    patch.serviceType = body.serviceType as ServiceType;
  }

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

  if (body.serviceCenter !== undefined) patch.serviceCenter = body.serviceCenter;
  if (body.notes !== undefined) patch.notes = body.notes;

  if (body.status !== undefined) {
    if (!STATUSES.includes(body.status as BookingStatus)) {
      return NextResponse.json(
        { error: `status must be one of ${STATUSES.join(", ")}` },
        { status: 400 },
      );
    }
    patch.status = body.status as BookingStatus;
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
