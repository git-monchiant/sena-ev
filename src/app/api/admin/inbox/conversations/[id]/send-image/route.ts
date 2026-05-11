import { mkdir, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { NextResponse } from "next/server";
import { saveOutboundMessage } from "@/lib/conversations";
import { queryOne } from "@/lib/db";
import { sendLineMessage } from "@/lib/line/send";
import { emitInboxEvent } from "@/lib/sse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 10 * 1024 * 1024;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const form = await req.formData();
  const file = form.get("file") as File | null;
  const quotedMessageId = (form.get("quotedMessageId") as string | null) || null;

  if (!file) {
    return NextResponse.json({ error: "file required" }, { status: 400 });
  }
  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json(
      { error: `unsupported image type: ${file.type}` },
      { status: 415 },
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "file too large (max 10MB)" }, { status: 413 });
  }

  const conversation = await queryOne<{ line_user_id: string }>(
    `SELECT cust.line_user_id
     FROM sena_ev.conversations c
     JOIN sena_ev.customers cust ON cust.id = c.customer_id
     WHERE c.id = $1`,
    [id],
  );
  if (!conversation) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const ext = mimeToExt(file.type);
  const fileName = `${randomUUID()}.${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads", "messages");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, fileName), Buffer.from(await file.arrayBuffer()));

  const base = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const imageUrl = `${base}/uploads/messages/${fileName}`;

  try {
    const { mode, lineMessageId } = await sendLineMessage({
      conversationId: id,
      lineUserId: conversation.line_user_id,
      quotedMessageId,
      message: {
        type: "image",
        originalContentUrl: imageUrl,
        previewImageUrl: imageUrl,
      },
    });

    const saved = await saveOutboundMessage({
      conversationId: id,
      agentId: null,
      messageType: "image",
      content: { imageUrl, fileName, mimeType: file.type, size: file.size },
      preview: "[รูปภาพ]",
      quotedMessageId,
      lineMessageId,
    });

    emitInboxEvent({
      type: "status_change",
      conversationId: id,
      status: "replied",
      at: Date.now(),
    });

    return NextResponse.json({ ok: true, messageId: saved.id, mode });
  } catch (err) {
    console.error("[send-image] failed:", err);
    return NextResponse.json(
      { error: "send failed", detail: String(err) },
      { status: 502 },
    );
  }
}

function mimeToExt(mime: string): string {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpg";
}
