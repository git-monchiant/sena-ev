import { NextResponse } from "next/server";
import { getCustomerByLineUserId } from "@/lib/customer-state";
import { getActivePolicy, getPrimaryVehicle } from "@/lib/vehicles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const lineUserId = url.searchParams.get("lineUserId");
  if (!lineUserId) {
    return NextResponse.json(
      { error: "lineUserId is required" },
      { status: 400 },
    );
  }
  const customer = await getCustomerByLineUserId(lineUserId);
  if (!customer) {
    return NextResponse.json({ vehicle: null, insurance: null });
  }
  const vehicle = await getPrimaryVehicle(customer.id);
  if (!vehicle) {
    return NextResponse.json({ vehicle: null, insurance: null });
  }
  const insurance = await getActivePolicy(vehicle.id);
  return NextResponse.json({ vehicle, insurance });
}
