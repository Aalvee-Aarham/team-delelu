import { env } from "../config/env";
import { createGroqProvider } from "./provider.groq";
import { createGeminiProvider } from "./provider.gemini";
import { ChatMessage, Provider, ProviderError, ProviderReply } from "./provider.types";

export const CHAIN: Provider[] = [
  createGroqProvider(env.GROQ_API_KEY_1, "groq#1"),
  createGroqProvider(env.GROQ_API_KEY_2, "groq#2"),
  createGeminiProvider(env.GEMINI_API_KEY_1, "gemini#1", "gemini-3.8-flash"),
  createGeminiProvider(env.GEMINI_API_KEY_2, "gemini#2", "gemini-3.5-flash"),
  createGeminiProvider(env.GEMINI_API_KEY_1, "gemini#3", "gemini-flash-latest"),
];

export interface ChainReply extends ProviderReply {
  servedBy: Provider;
  attempts: { label: string; error: string }[];
}

export async function completeWithFallback(messages: ChatMessage[]): Promise<ChainReply> {
  const attempts: { label: string; error: string }[] = [];

  for (const provider of CHAIN) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), env.LLM_TIMEOUT_MS);
    try {
      const reply = await provider.complete(messages, controller.signal);
      return { ...reply, servedBy: provider, attempts };
    } catch (err) {
      const isAbort = err instanceof Error && err.name === "AbortError";
      const message = isAbort ? `timed out after ${env.LLM_TIMEOUT_MS}ms` : err instanceof Error ? err.message : String(err);
      attempts.push({ label: provider.label, error: message });
      if (err instanceof ProviderError && !err.retryable && !isAbort) {
        continue;
      }
    } finally {
      clearTimeout(timer);
    }
  }

  throw new Error(`All LLM providers failed: ${attempts.map((a) => `${a.label} (${a.error})`).join("; ")}`);
}

export async function checkChainHealth() {
  return Promise.all(
    CHAIN.map(async (p) => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), env.LLM_TIMEOUT_MS);
      try {
        await p.complete([{ role: "user", content: "ping" }], controller.signal);
        return { provider: p.provider, label: p.label, model: p.model, ok: true };
      } catch (err) {
        return { provider: p.provider, label: p.label, model: p.model, ok: false, error: err instanceof Error ? err.message : String(err) };
      } finally {
        clearTimeout(timer);
      }
    })
  );
}
