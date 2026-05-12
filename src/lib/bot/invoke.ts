import "server-only";
import { queryOne } from "../db";
import { assembleBotContext } from "./context/assemble";
import { generateWithTools, type ChatTurn } from "./llm";
import { renderContextBlock, SYSTEM_PROMPT } from "./prompt";
import {
  getFunctionDeclarations,
  runTool,
  type ToolContext,
} from "./tools";

export type BotReply = {
  reply: string;
  model: string;
  toolCalls: { name: string; args: Record<string, unknown> }[];
  contextMd: string;
  promptTokensEstimate: number;
};

/**
 * Generate one bot reply for a conversation given a fresh inbound
 * message. Tools are wired (lookup_*, search_wiki, calculate_financing,
 * send_material, escalate).
 *
 * `send_material` and `escalate` HAVE side effects (LINE push / DB write).
 * Caller still owns saving the assistant's text reply.
 */
export async function generateBotReply(params: {
  conversationId: string;
  userText: string;
  transcriptLimit?: number;
}): Promise<BotReply> {
  const ctx = await assembleBotContext(params.conversationId, {
    transcriptLimit: params.transcriptLimit ?? 30,
  });
  if (!ctx) {
    throw new Error(`conversation ${params.conversationId} not found`);
  }

  const lineUserRow = await queryOne<{ line_user_id: string }>(
    `SELECT line_user_id FROM sena_ev.customers WHERE id = $1`,
    [ctx.customerId],
  );

  const toolCtx: ToolContext = {
    conversationId: params.conversationId,
    customerId: ctx.customerId,
    lineUserId: lineUserRow?.line_user_id ?? null,
  };

  const history: ChatTurn[] = ctx.transcript
    .filter((t) => t.role !== "system")
    .map((t) => ({
      role: t.role === "user" ? "user" : "model",
      text: t.text,
    }));

  const systemInstruction = `${SYSTEM_PROMPT}\n\n${renderContextBlock(ctx.contextMd)}`;

  const { text, model, toolCalls } = await generateWithTools({
    systemInstruction,
    history,
    userText: params.userText,
    tools: getFunctionDeclarations(),
    runTool: (name, args) => runTool(name, args, toolCtx),
  });

  return {
    reply: text,
    model,
    toolCalls: toolCalls.map((c) => ({ name: c.name, args: c.args })),
    contextMd: ctx.contextMd,
    promptTokensEstimate: Math.ceil(
      (systemInstruction.length + params.userText.length) / 4,
    ),
  };
}
