import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { runAgent } from "../agent/runner";
import { checkChainHealth, CHAIN } from "../agent/provider.chain";

export const agentRouter = Router();

const chatSchema = z.object({
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1) }))
    .min(1),
});

agentRouter.post("/chat", requireAuth, async (req, res, next) => {
  try {
    const { messages } = chatSchema.parse(req.body);
    const result = await runAgent(messages, req.auth!);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

agentRouter.get("/health", requireAuth, async (req, res, next) => {
  try {
    if (req.query.deep === "true") {
      res.json({ chain: await checkChainHealth() });
      return;
    }
    res.json({ chain: CHAIN.map((p) => ({ provider: p.provider, label: p.label, model: p.model })) });
  } catch (err) {
    next(err);
  }
});
