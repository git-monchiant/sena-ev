import "server-only";
import {
  GoogleGenAI,
  type Content,
  type FunctionDeclaration,
} from "@google/genai";

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (client) return client;
  const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY (or GOOGLE_API_KEY) is not set");
  }
  client = new GoogleGenAI({ apiKey });
  return client;
}

export const DEFAULT_MODEL =
  process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

export type ChatTurn = {
  role: "user" | "model";
  text: string;
};

export type FunctionCallExec = {
  name: string;
  args: Record<string, unknown>;
  result: unknown;
};

export type GenerateResult = {
  text: string;
  model: string;
  toolCalls: FunctionCallExec[];
};

/**
 * Run a generation with tool calling support. Loops up to maxIters
 * if the model wants to call functions.
 */
export async function generateWithTools(params: {
  systemInstruction: string;
  history: ChatTurn[];
  userText: string;
  tools?: FunctionDeclaration[];
  runTool?: (
    name: string,
    args: Record<string, unknown>,
  ) => Promise<unknown>;
  model?: string;
  temperature?: number;
  maxIters?: number;
}): Promise<GenerateResult> {
  const model = params.model ?? DEFAULT_MODEL;
  const ai = getClient();

  const contents: Content[] = [
    ...params.history.map<Content>((t) => ({
      role: t.role,
      parts: [{ text: t.text }],
    })),
    { role: "user", parts: [{ text: params.userText }] },
  ];

  const toolsArg =
    params.tools && params.tools.length > 0
      ? [{ functionDeclarations: params.tools }]
      : undefined;

  const executed: FunctionCallExec[] = [];
  const maxIters = params.maxIters ?? 4;

  for (let i = 0; i < maxIters; i++) {
    const res = await ai.models.generateContent({
      model,
      contents,
      config: {
        systemInstruction: params.systemInstruction,
        temperature: params.temperature ?? 0.6,
        tools: toolsArg,
      },
    });

    const fnCalls = res.functionCalls ?? [];
    if (fnCalls.length === 0) {
      return { text: res.text ?? "", model, toolCalls: executed };
    }

    // Record model's tool-call turn so the API knows we processed them
    contents.push({
      role: "model",
      parts: fnCalls.map((fc) => ({
        functionCall: { name: fc.name ?? "", args: fc.args ?? {} },
      })),
    });

    // Execute each tool, append responses
    const responseParts: Content["parts"] = [];
    for (const fc of fnCalls) {
      const name = fc.name ?? "";
      const args = (fc.args ?? {}) as Record<string, unknown>;
      const result = params.runTool
        ? await params.runTool(name, args)
        : { error: `no runner for ${name}` };
      executed.push({ name, args, result });
      responseParts.push({
        functionResponse: {
          name,
          response: { result } as Record<string, unknown>,
        },
      });
    }
    contents.push({ role: "user", parts: responseParts });
  }

  return { text: "", model, toolCalls: executed };
}

/* ─── legacy export kept for callers that don't need tools ─── */
export async function generate(params: {
  systemInstruction: string;
  history: ChatTurn[];
  userText: string;
  model?: string;
  temperature?: number;
}): Promise<{ text: string; model: string }> {
  const r = await generateWithTools({ ...params, tools: undefined });
  return { text: r.text, model: r.model };
}
