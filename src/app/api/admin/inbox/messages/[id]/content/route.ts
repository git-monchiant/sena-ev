import { queryOne } from "@/lib/db";
import { getMessagingBlobClient } from "@/lib/line/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CONTENT_TYPES: Record<string, string> = {
  image: "image/jpeg",
  video: "video/mp4",
  audio: "audio/m4a",
  file: "application/octet-stream",
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const msg = await queryOne<{
    line_message_id: string | null;
    message_type: string;
    content: { fileName?: string };
  }>(
    `SELECT line_message_id, message_type, content
     FROM sena_ev.messages
     WHERE id = $1 AND direction = 'inbound'`,
    [id],
  );

  if (!msg?.line_message_id) {
    return new Response("not found", { status: 404 });
  }

  try {
    const blob = await getMessagingBlobClient().getMessageContent(msg.line_message_id);
    const headers = new Headers();
    headers.set(
      "Content-Type",
      CONTENT_TYPES[msg.message_type] ?? "application/octet-stream",
    );
    if (msg.message_type === "file" && msg.content?.fileName) {
      headers.set(
        "Content-Disposition",
        `inline; filename="${encodeURIComponent(msg.content.fileName)}"`,
      );
    }
    headers.set("Cache-Control", "private, max-age=86400");
    return new Response(blob as unknown as BodyInit, { headers });
  } catch (err) {
    console.error("[content] fetch failed:", err);
    return new Response(`upstream error: ${String(err)}`, { status: 502 });
  }
}
