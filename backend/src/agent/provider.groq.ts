import { toOpenAiTools } from "./tools.schema";
import { ChatMessage, Provider, ProviderError, ProviderReply, ToolCall } from "./provider.types";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "openai/gpt-oss-120b";

interface GroqChoiceMessage {
  content: string | null;
  tool_calls?: { id: string; function: { name: string; arguments: string } }[];
}

function toGroqMessages(messages: ChatMessage[]) {
  return messages.map((m) => {
    if (m.role === "tool") {
      return { role: "tool", tool_call_id: m.tool_call_id, content: m.content };
    }
    if (m.role === "assistant" && m.tool_calls && m.tool_calls.length > 0) {
      return {
        role: "assistant",
        content: m.content,
        tool_calls: m.tool_calls.map((t) => ({
          id: t.id,
          type: "function",
          function: { name: t.name, arguments: JSON.stringify(t.args) },
        })),
      };
    }
    return { role: m.role, content: m.content };
  });
}

export function createGroqProvider(apiKey: string, label: string): Provider {
  return {
    label,
    provider: "groq",
    model: GROQ_MODEL,
    async complete(messages: ChatMessage[], signal: AbortSignal): Promise<ProviderReply> {
      const res = await fetch(GROQ_URL, {
        method: "POST",
        signal,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: toGroqMessages(messages),
          tools: toOpenAiTools(),
          tool_choice: "auto",
          temperature: 0.2,
        }),
      });

      if (!res.ok) {
        const body = await res.text();
        throw new ProviderError(`Groq ${label} HTTP ${res.status}: ${body.slice(0, 200)}`, res.status === 429 || res.status >= 500);
      }

      const json = (await res.json()) as { choices: { message: GroqChoiceMessage }[] };
      const message = json.choices[0]?.message;
      if (!message) {
        throw new ProviderError(`Groq ${label} returned no choices`, true);
      }

      const toolCalls: ToolCall[] = (message.tool_calls ?? []).map((t) => {
        let args: Record<string, unknown> = {};
        try {
          args = t.function.arguments ? JSON.parse(t.function.arguments) : {};
        } catch {
          args = {};
        }
        return { id: t.id, name: t.function.name, args };
      });

      return { content: message.content ?? "", toolCalls };
    },
  };
}
