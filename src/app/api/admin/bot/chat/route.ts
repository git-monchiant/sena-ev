import { NextResponse } from "next/server";
import { generateBotReply } from "@/lib/bot/invoke";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = (await req.json()) as {
    conversationId?: string;
    message?: string;
    showContext?: boolean;
  };

  if (!body.conversationId) {
    return NextResponse.json(
      { error: "conversationId is required" },
      { status: 400 },
    );
  }
  if (!body.message) {
    return NextResponse.json(
      { error: "message is required" },
      { status: 400 },
    );
  }

  try {
    const result = await generateBotReply({
      conversationId: body.conversationId,
      userText: body.message,
    });
    return NextResponse.json({
      reply: result.reply,
      model: result.model,
      toolCalls: result.toolCalls,
      promptTokensEstimate: result.promptTokensEstimate,
      contextMd: body.showContext ? result.contextMd : undefined,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
