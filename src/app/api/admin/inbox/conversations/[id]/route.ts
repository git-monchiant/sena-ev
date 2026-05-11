import { NextResponse } from "next/server";
import {
  getConversationDetail,
  markConversationRead,
} from "@/lib/conversations";
import { query, queryOne } from "@/lib/db";
import { listCustomerTags } from "@/lib/tags";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const detail = await getConversationDetail(id);
  if (!detail) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  await markConversationRead(id);

  const leads = await query<{
    id: string;
    type: string;
    status: string;
    payload: Record<string, unknown>;
    created_at: Date;
  }>(
    `SELECT id, type, status, payload, created_at
     FROM sena_ev.leads
     WHERE customer_id = $1
     ORDER BY created_at DESC LIMIT 20`,
    [detail.conversation.customer_id],
  );

  const customer = await queryOne<{
    phone: string | null;
    email: string | null;
    state: string;
    followed_at: Date | null;
  }>(
    `SELECT phone, email, state, followed_at
     FROM sena_ev.customers WHERE id = $1`,
    [detail.conversation.customer_id],
  );

  const tags = await listCustomerTags(detail.conversation.customer_id);

  const serviceBookings = await query<{
    id: string;
    service_type: string;
    scheduled_at: Date;
    service_center: string | null;
    status: string;
    notes: string | null;
    created_at: Date;
  }>(
    `SELECT id, service_type, scheduled_at, service_center, status, notes, created_at
     FROM sena_ev.service_bookings
     WHERE customer_id = $1
     ORDER BY scheduled_at DESC LIMIT 50`,
    [detail.conversation.customer_id],
  );

  return NextResponse.json({
    conversation: detail.conversation,
    messages: detail.messages,
    customer,
    leads: leads.rows,
    tags,
    serviceBookings: serviceBookings.rows,
  });
}
