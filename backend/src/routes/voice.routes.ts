import { Router, raw } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { synthesizeSpeech, transcribeAudio } from "../services/voice.service";

export const voiceRouter = Router();

const speakSchema = z.object({ text: z.string().min(1).max(3000) });

voiceRouter.post("/speak", requireAuth, async (req, res, next) => {
  try {
    const { text } = speakSchema.parse(req.body);
    const audio = await synthesizeSpeech(text);
    res.set("Content-Type", "audio/mpeg");
    res.send(audio);
  } catch (err) {
    next(err);
  }
});

voiceRouter.post("/transcribe", requireAuth, raw({ type: "application/octet-stream", limit: "10mb" }), async (req, res, next) => {
  try {
    const sampleRateHertz = Number(req.query.sampleRate) || 16000;
    const text = await transcribeAudio(req.body as Buffer, sampleRateHertz);
    res.json({ text });
  } catch (err) {
    next(err);
  }
});
