import { NextResponse } from "next/server";
import { queryOne } from "@/lib/db";
import {
  setCustomerState,
  syncMenuFromState,
  type CustomerState,
} from "@/lib/customer-state";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED: ReadonlyArray<CustomerState> = ["LEAD", "OWNER"];

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await req.json()) as { state?: string };
  const state = body.state as CustomerState | undefined;

  if (!state || !ALLOWED.includes(state)) {
    return NextResponse.json(
      { error: `state must be one of: ${ALLOWED.join(", ")}` },
      { status: 400 },
    );
  }

  const customer = await queryOne<{ line_user_id: string }>(
    `SELECT line_user_id FROM sena_ev.customers WHERE id = $1`,
    [id],
  );
  if (!customer) {
    return NextResponse.json({ error: "customer not found" }, { status: 404 });
  }

  await setCustomerState(customer.line_user_id, state);
  try {
    await syncMenuFromState(customer.line_user_id, state);
  } catch (err) {
    console.error("[state] syncMenuFromState failed:", err);
    return NextResponse.json(
      {
        ok: true,
        warning: `state updated but rich menu sync failed: ${String(err)}`,
      },
      { status: 200 },
    );
  }

  return NextResponse.json({ ok: true, state });
}
