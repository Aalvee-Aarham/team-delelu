import { toGeminiTools } from "./tools.schema";
import { ChatMessage, Provider, ProviderError, ProviderReply, ToolCall } from "./provider.types";

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

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
      let parsed: unknown;
      try {
        parsed = JSON.parse(m.content);
      } catch {
        parsed = m.content;
      }
      const response =
        parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)
          ? (parsed as Record<string, unknown>)
          : { result: parsed };
      contents.push({ role: "user", parts: [{ functionResponse: { name: m.name ?? "tool", response } }] });
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

export function createGeminiProvider(apiKey: string, label: string, model: string): Provider {
  return {
    label,
    provider: "gemini",
    model,
    async complete(messages: ChatMessage[], signal: AbortSignal): Promise<ProviderReply> {
      const system = messages.find((m) => m.role === "system");
      const res = await fetch(`${GEMINI_BASE}/${model}:generateContent`, {
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
