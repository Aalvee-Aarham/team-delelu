import { PollyClient, SynthesizeSpeechCommand } from "@aws-sdk/client-polly";
import { TranscribeStreamingClient, StartStreamTranscriptionCommand, AudioStream } from "@aws-sdk/client-transcribe-streaming";
import { env } from "../config/env";

const credentials = { accessKeyId: env.AWS_ACCESS_KEY_ID, secretAccessKey: env.AWS_SECRET_ACCESS_KEY };
const pollyClient = new PollyClient({ region: env.AWS_REGION, credentials });
const transcribeClient = new TranscribeStreamingClient({ region: env.AWS_REGION, credentials });

export async function synthesizeSpeech(text: string): Promise<Buffer> {
  const command = new SynthesizeSpeechCommand({ Text: text, OutputFormat: "mp3", VoiceId: "Joanna", Engine: "neural" });
  const response = await pollyClient.send(command);
  const chunks: Uint8Array[] = [];
  for await (const chunk of response.AudioStream as AsyncIterable<Uint8Array>) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

const AUDIO_CHUNK_BYTES = 8192;

async function* pcmChunks(buffer: Buffer): AsyncGenerator<AudioStream> {
  for (let i = 0; i < buffer.length; i += AUDIO_CHUNK_BYTES) {
    yield { AudioEvent: { AudioChunk: buffer.subarray(i, i + AUDIO_CHUNK_BYTES) } };
  }
}

export async function transcribeAudio(pcm: Buffer, sampleRateHertz: number): Promise<string> {
  const command = new StartStreamTranscriptionCommand({
    LanguageCode: "en-US",
    MediaEncoding: "pcm",
    MediaSampleRateHertz: sampleRateHertz,
    AudioStream: pcmChunks(pcm),
  });
  const response = await transcribeClient.send(command);
  let transcript = "";
  for await (const event of response.TranscriptResultStream ?? []) {
    const results = event.TranscriptEvent?.Transcript?.Results ?? [];
    for (const result of results) {
      if (!result.IsPartial && result.Alternatives?.[0]?.Transcript) {
        transcript += (transcript ? " " : "") + result.Alternatives[0].Transcript;
      }
    }
  }
  return transcript.trim();
}
