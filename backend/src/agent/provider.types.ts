export interface ToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
  geminiThoughtSignature?: string;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
  name?: string;
}

export interface ProviderReply {
  content: string;
  toolCalls: ToolCall[];
}

export interface Provider {
  label: string;
  provider: "groq" | "gemini";
  model: string;
  complete(messages: ChatMessage[], signal: AbortSignal): Promise<ProviderReply>;
}

export class ProviderError extends Error {
  retryable: boolean;

  constructor(message: string, retryable: boolean) {
    super(message);
    this.retryable = retryable;
  }
}
