import { api } from "@/lib/axios";

const TARGET_SAMPLE_RATE = 16000;

function resampleTo16k(input: Float32Array, inputSampleRate: number): Float32Array {
  if (inputSampleRate === TARGET_SAMPLE_RATE) return input;
  const ratio = inputSampleRate / TARGET_SAMPLE_RATE;
  const outLength = Math.floor(input.length / ratio);
  const output = new Float32Array(outLength);
  for (let i = 0; i < outLength; i++) {
    const srcIndex = i * ratio;
    const lo = Math.floor(srcIndex);
    const hi = Math.min(lo + 1, input.length - 1);
    const frac = srcIndex - lo;
    output[i] = input[lo] * (1 - frac) + input[hi] * frac;
  }
  return output;
}

function floatTo16BitPCM(input: Float32Array): ArrayBuffer {
  const buffer = new ArrayBuffer(input.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return buffer;
}

export class VoiceRecorder {
  private ctx: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private mute: GainNode | null = null;
  private chunks: Float32Array[] = [];

  async start() {
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.ctx = new AudioContext();
    this.source = this.ctx.createMediaStreamSource(this.stream);
    this.processor = this.ctx.createScriptProcessor(4096, 1, 1);
    this.mute = this.ctx.createGain();
    this.mute.gain.value = 0;
    this.chunks = [];

    this.processor.onaudioprocess = (e) => {
      this.chunks.push(new Float32Array(e.inputBuffer.getChannelData(0)));
    };

    this.source.connect(this.processor);
    this.processor.connect(this.mute);
    this.mute.connect(this.ctx.destination);
  }

  stop(): ArrayBuffer {
    const sampleRate = this.ctx?.sampleRate ?? TARGET_SAMPLE_RATE;
    this.processor?.disconnect();
    this.source?.disconnect();
    this.mute?.disconnect();
    this.stream?.getTracks().forEach((t) => t.stop());
    this.ctx?.close();

    const totalLength = this.chunks.reduce((sum, c) => sum + c.length, 0);
    const merged = new Float32Array(totalLength);
    let offset = 0;
    for (const chunk of this.chunks) {
      merged.set(chunk, offset);
      offset += chunk.length;
    }

    const resampled = resampleTo16k(merged, sampleRate);
    return floatTo16BitPCM(resampled);
  }
}

export async function transcribeAudio(pcm: ArrayBuffer): Promise<string> {
  const { data } = await api.post<{ text: string }>("/voice/transcribe", pcm, {
    params: { sampleRate: TARGET_SAMPLE_RATE },
    headers: { "Content-Type": "application/octet-stream" },
  });
  return data.text;
}

export async function speakText(text: string): Promise<string> {
  const { data } = await api.post("/voice/speak", { text }, { responseType: "blob" });
  return URL.createObjectURL(data as Blob);
}
