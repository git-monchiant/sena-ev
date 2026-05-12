import { NextResponse } from "next/server";
import { getCustomerByLineUserId } from "@/lib/customer-state";
import { getActivePolicy, listByCustomer } from "@/lib/vehicles";

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
    return NextResponse.json({
      vehicles: [],
      insurances: {},
      vehicle: null,
      insurance: null,
    });
  }
  const vehicles = await listByCustomer(customer.id);
  const insurances: Record<string, Awaited<ReturnType<typeof getActivePolicy>>> =
    {};
  for (const v of vehicles) {
    insurances[v.id] = await getActivePolicy(v.id);
  }
  // Back-compat: keep `vehicle` + `insurance` for clients still on the
  // single-car shape.
  return NextResponse.json({
    vehicles,
    insurances,
    vehicle: vehicles[0] ?? null,
    insurance: vehicles[0] ? insurances[vehicles[0].id] : null,
  });
}
