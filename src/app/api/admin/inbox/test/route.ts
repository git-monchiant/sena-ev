import { NextResponse } from "next/server";
import { emitInboxEvent } from "@/lib/sse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    customerName?: string;
    preview?: string;
    messageType?: string;
  };
  emitInboxEvent({
    type: "new_message",
    conversationId: `test-${Math.random().toString(36).slice(2, 8)}`,
    messageId: `msg-${Date.now()}`,
    customerName: body.customerName ?? "Test User",
    preview: body.preview ?? "ทดสอบข้อความจาก SSE",
    messageType: body.messageType ?? "text",
    at: Date.now(),
  });
  return NextResponse.json({ ok: true });
}
