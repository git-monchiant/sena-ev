import { NextResponse } from "next/server";
import {
  create,
  listByCustomer,
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
  const appointments = await listByCustomer(id);
  return NextResponse.json({ appointments });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await req.json()) as {
    serviceType?: string;
    scheduledAt?: string;
    serviceCenter?: string;
    notes?: string;
    status?: string;
  };

  if (!body.serviceType || !SERVICE_TYPES.includes(body.serviceType as ServiceType)) {
    return NextResponse.json(
      { error: `serviceType must be one of ${SERVICE_TYPES.join(", ")}` },
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
  if (body.status && !STATUSES.includes(body.status as BookingStatus)) {
    return NextResponse.json(
      { error: `status must be one of ${STATUSES.join(", ")}` },
      { status: 400 },
    );
  }

  const appointment = await create({
    customerId: id,
    serviceType: body.serviceType as ServiceType,
    scheduledAt,
    serviceCenter: body.serviceCenter,
    notes: body.notes,
    status: body.status as BookingStatus | undefined,
  });

  return NextResponse.json({ appointment }, { status: 201 });
}
