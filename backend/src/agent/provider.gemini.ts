import { toGeminiTools } from "./tools.schema";
import { ChatMessage, Provider, ProviderError, ProviderReply, ToolCall } from "./provider.types";

const GEMINI_MODEL = "gemini-3.8-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

interface GeminiPart {
  text?: string;
  functionCall?: { name: string; args: Record<string, unknown> };
  functionResponse?: { name: string; response: Record<string, unknown> };
}

function toGeminiContents(messages: ChatMessage[]) {
  const contents: { role: string; parts: GeminiPart[] }[] = [];
  for (const m of messages) {
    if (m.role === "system") continue;
    if (m.role === "tool") {
      let parsed: Record<string, unknown>;
      try {
        parsed = JSON.parse(m.content) as Record<string, unknown>;
      } catch {
        parsed = { result: m.content };
      }
      contents.push({ role: "user", parts: [{ functionResponse: { name: m.name ?? "tool", response: parsed } }] });
      continue;
    }
    if (m.role === "assistant" && m.tool_calls && m.tool_calls.length > 0) {
      contents.push({
        role: "model",
        parts: m.tool_calls.map((t) => ({ functionCall: { name: t.name, args: t.args } })),
      });
      continue;
    }
    contents.push({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] });
  }
  return contents;
}

export function createGeminiProvider(apiKey: string, label: string): Provider {
  return {
    label,
    provider: "gemini",
    model: GEMINI_MODEL,
    async complete(messages: ChatMessage[], signal: AbortSignal): Promise<ProviderReply> {
      const system = messages.find((m) => m.role === "system");
      const res = await fetch(GEMINI_URL, {
        method: "POST",
        signal,
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({
          contents: toGeminiContents(messages),
          tools: toGeminiTools(),
          systemInstruction: system ? { parts: [{ text: system.content }] } : undefined,
          generationConfig: { temperature: 0.2 },
        }),
      });

      if (!res.ok) {
        const body = await res.text();
        throw new ProviderError(`Gemini ${label} HTTP ${res.status}: ${body.slice(0, 200)}`, res.status === 429 || res.status >= 500);
      }

      const json = (await res.json()) as {
        candidates?: { content?: { parts?: GeminiPart[] } }[];
      };
      const parts = json.candidates?.[0]?.content?.parts ?? [];

      const toolCalls: ToolCall[] = [];
      let content = "";
      let counter = 0;
      for (const part of parts) {
        if (part.functionCall) {
          toolCalls.push({
            id: `gemini-${Date.now()}-${counter++}`,
            name: part.functionCall.name,
            args: part.functionCall.args ?? {},
          });
        } else if (part.text) {
          content += part.text;
        }
      }

      return { content, toolCalls };
    },
  };
}
