let audioContext: AudioContext | null = null;
let audioUnlocked = false;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  if (audioContext.state === "suspended") {
    audioContext.resume();
  }
  return audioContext;
}

function unlockAudio() {
  if (audioUnlocked) return;
  try {
    const ctx = getAudioContext();
    if (ctx.state === "suspended") {
      ctx.resume();
    }
    const silent = ctx.createOscillator();
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime);
    silent.connect(gain);
    gain.connect(ctx.destination);
    silent.start(ctx.currentTime);
    silent.stop(ctx.currentTime + 0.001);
    audioUnlocked = true;
  } catch {}
}

if (typeof window !== "undefined") {
  const events = ["touchstart", "touchend", "click", "keydown"];
  const handler = () => {
    unlockAudio();
    events.forEach(e => document.removeEventListener(e, handler, true));
  };
  events.forEach(e => document.addEventListener(e, handler, { once: true, capture: true }));
}

function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = "sine",
  volume: number = 0.3,
  delay: number = 0,
) {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(frequency, ctx.currentTime + delay);
  gain.gain.setValueAtTime(0, ctx.currentTime + delay);
  gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + delay + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime + delay);
  osc.stop(ctx.currentTime + delay + duration);
}

function generateWavBase64(frequencies: number[], durations: number[], volume: number = 0.4): string {
  const sampleRate = 22050;
  const totalDuration = durations.reduce((sum, d, i) => {
    const startTime = i === 0 ? 0 : durations.slice(0, i).reduce((s, dur, j) => Math.max(s, (j * 0.12) + dur), 0);
    return Math.max(sum, (i * 0.12) + durations[i]);
  }, 0);
  const numSamples = Math.ceil(sampleRate * (totalDuration + 0.05));
  const buffer = new Float32Array(numSamples);

  frequencies.forEach((freq, i) => {
    const startSample = Math.floor(sampleRate * i * 0.12);
    const durSamples = Math.floor(sampleRate * durations[i]);
    for (let s = 0; s < durSamples && (startSample + s) < numSamples; s++) {
      const t = s / sampleRate;
      const envelope = Math.max(0, 1 - (t / durations[i]) * 1.5);
      buffer[startSample + s] += Math.sin(2 * Math.PI * freq * t) * volume * envelope;
    }
  });

  const int16 = new Int16Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    int16[i] = Math.max(-32768, Math.min(32767, Math.floor(buffer[i] * 32767)));
  }

  const wavSize = 44 + int16.length * 2;
  const wav = new ArrayBuffer(wavSize);
  const view = new DataView(wav);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };

  writeString(0, "RIFF");
  view.setUint32(4, wavSize - 8, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, int16.length * 2, true);

  for (let i = 0; i < int16.length; i++) {
    view.setInt16(44 + i * 2, int16[i], true);
  }

  const bytes = new Uint8Array(wav);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return "data:audio/wav;base64," + btoa(binary);
}

const soundCache: Record<string, string> = {};

function getSoundDataUrl(type: string): string {
  if (soundCache[type]) return soundCache[type];

  let url: string;
  switch (type) {
    case "new_order":
      url = generateWavBase64([880, 1108.73, 1318.51], [0.15, 0.15, 0.25], 0.35);
      break;
    case "strike":
      url = generateWavBase64([330, 277.18, 220], [0.3, 0.3, 0.5], 0.25);
      break;
    case "payout":
      url = generateWavBase64([523.25, 659.25, 783.99, 1046.5], [0.12, 0.12, 0.12, 0.2], 0.3);
      break;
    case "alert":
      url = generateWavBase64([800, 600, 800], [0.15, 0.15, 0.2], 0.3);
      break;
    case "message":
    case "chat":
      url = generateWavBase64([660, 880], [0.1, 0.15], 0.25);
      break;
    default:
      url = generateWavBase64([587.33, 784], [0.12, 0.18], 0.25);
      break;
  }

  soundCache[type] = url;
  return url;
}

function playWithHtmlAudio(type: string): boolean {
  try {
    const url = getSoundDataUrl(type);
    const audio = new Audio(url);
    audio.volume = 0.6;
    const playPromise = audio.play();
    if (playPromise) {
      playPromise.catch(() => {});
    }
    return true;
  } catch {
    return false;
  }
}

function playWithWebAudio(type: string) {
  switch (type) {
    case "new_order":
      playTone(880, 0.15, "sine", 0.25, 0);
      playTone(1108.73, 0.15, "sine", 0.25, 0.12);
      playTone(1318.51, 0.25, "sine", 0.3, 0.24);
      break;
    case "strike":
      playTone(330, 0.3, "square", 0.15, 0);
      playTone(277.18, 0.3, "square", 0.15, 0.25);
      playTone(220, 0.5, "square", 0.2, 0.5);
      break;
    case "payout":
      playTone(523.25, 0.12, "sine", 0.2, 0);
      playTone(659.25, 0.12, "sine", 0.2, 0.1);
      playTone(783.99, 0.12, "sine", 0.2, 0.2);
      playTone(1046.5, 0.2, "sine", 0.25, 0.3);
      break;
    case "alert":
      playTone(800, 0.15, "triangle", 0.25, 0);
      playTone(600, 0.15, "triangle", 0.25, 0.18);
      playTone(800, 0.2, "triangle", 0.25, 0.36);
      break;
    case "message":
    case "chat":
      playTone(660, 0.1, "sine", 0.2, 0);
      playTone(880, 0.15, "sine", 0.22, 0.08);
      break;
    default:
      playTone(587.33, 0.12, "sine", 0.2, 0);
      playTone(784, 0.18, "sine", 0.22, 0.1);
      break;
  }
}

export function playNotificationSound(type: string) {
  try {
    const played = playWithHtmlAudio(type);
    if (!played) {
      if (audioContext?.state === "suspended") {
        audioContext.resume();
      }
      playWithWebAudio(type);
    }
  } catch (err) {
    try {
      playWithWebAudio(type);
    } catch {}
  }
}
