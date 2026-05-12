import { NextResponse } from "next/server";
import { getCustomerByLineUserId } from "@/lib/customer-state";
import { listByCustomer } from "@/lib/notifications";

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
    return NextResponse.json({ notifications: [] });
  }
  const notifications = await listByCustomer(customer.id);
  return NextResponse.json({ notifications });
}
