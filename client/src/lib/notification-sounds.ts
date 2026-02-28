const SAMPLE_RATE = 22050;

let audioPool: HTMLAudioElement[] = [];
let isUnlocked = false;
let globalVolume = parseFloat(typeof window !== "undefined" ? (localStorage.getItem("notif-sound-volume") || "0.7") : "0.7");

export function getVolume(): number {
  return globalVolume;
}

export function setVolume(vol: number): void {
  globalVolume = Math.max(0, Math.min(1, vol));
  if (typeof window !== "undefined") {
    localStorage.setItem("notif-sound-volume", String(globalVolume));
  }
  for (const audio of audioPool) {
    audio.volume = globalVolume;
  }
}

type WaveType = "sine" | "square" | "sawtooth" | "triangle" | "noise";

interface ToneSegment {
  freq: number;
  dur: number;
  delay: number;
  wave?: WaveType;
  vol?: number;
  fadeIn?: number;
  fadeOut?: number;
  vibrato?: number;
  vibratoDepth?: number;
}

function oscillator(wave: WaveType, phase: number): number {
  const p = phase % (2 * Math.PI);
  switch (wave) {
    case "square":
      return p < Math.PI ? 1 : -1;
    case "sawtooth":
      return (p / Math.PI) - 1;
    case "triangle":
      return p < Math.PI ? (2 * p / Math.PI) - 1 : 3 - (2 * p / Math.PI);
    case "noise":
      return Math.random() * 2 - 1;
    case "sine":
    default:
      return Math.sin(phase);
  }
}

function generateAdvancedWav(segments: ToneSegment[], masterVol: number = 0.4): string {
  let totalLength = 0;
  for (const seg of segments) {
    totalLength = Math.max(totalLength, seg.delay + seg.dur);
  }
  const numSamples = Math.ceil(SAMPLE_RATE * (totalLength + 0.05));
  const buffer = new Float32Array(numSamples);

  for (const seg of segments) {
    const startSample = Math.floor(SAMPLE_RATE * seg.delay);
    const durSamples = Math.floor(SAMPLE_RATE * seg.dur);
    const vol = seg.vol ?? 1.0;
    const wave = seg.wave ?? "sine";
    const fadeIn = seg.fadeIn ?? 0;
    const fadeOut = seg.fadeOut ?? seg.dur;

    for (let s = 0; s < durSamples && (startSample + s) < numSamples; s++) {
      const t = s / SAMPLE_RATE;
      let freq = seg.freq;
      if (seg.vibrato && seg.vibratoDepth) {
        freq += Math.sin(2 * Math.PI * seg.vibrato * t) * seg.vibratoDepth;
      }
      const phase = 2 * Math.PI * freq * t;
      const sample = oscillator(wave, phase);

      let envelope = 1;
      if (fadeIn > 0 && t < fadeIn) envelope *= t / fadeIn;
      if (fadeOut < seg.dur && t > (seg.dur - fadeOut)) envelope *= (seg.dur - t) / fadeOut;
      envelope = Math.max(0, Math.min(1, envelope));
      const decay = Math.max(0, 1 - (t / seg.dur) * 0.8);
      envelope *= decay;

      buffer[startSample + s] += sample * vol * masterVol * envelope;
    }
  }

  const int16 = new Int16Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    const clamped = Math.max(-1, Math.min(1, buffer[i]));
    int16[i] = clamped < 0 ? clamped * 32768 : clamped * 32767;
  }

  const wavSize = 44 + int16.length * 2;
  const wav = new ArrayBuffer(wavSize);
  const v = new DataView(wav);

  const ws = (o: number, s: string) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  ws(0, "RIFF");
  v.setUint32(4, wavSize - 8, true);
  ws(8, "WAVE");
  ws(12, "fmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, SAMPLE_RATE, true);
  v.setUint32(28, SAMPLE_RATE * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  ws(36, "data");
  v.setUint32(40, int16.length * 2, true);
  for (let i = 0; i < int16.length; i++) v.setInt16(44 + i * 2, int16[i], true);

  const bytes = new Uint8Array(wav);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return "data:audio/wav;base64," + btoa(binary);
}

function silentWav(): string {
  return generateAdvancedWav([{ freq: 0, dur: 0.01, delay: 0, vol: 0 }], 0);
}

type SoundDef = { segments: ToneSegment[]; masterVol: number };

const soundDefs: Record<string, SoundDef> = {
  new_order: {
    masterVol: 0.5,
    segments: [
      { freq: 1200, dur: 0.08, delay: 0, wave: "square", vol: 0.6 },
      { freq: 1600, dur: 0.08, delay: 0.1, wave: "square", vol: 0.7 },
      { freq: 1200, dur: 0.08, delay: 0.25, wave: "square", vol: 0.6 },
      { freq: 1600, dur: 0.08, delay: 0.35, wave: "square", vol: 0.7 },
      { freq: 2000, dur: 0.15, delay: 0.45, wave: "sine", vol: 0.5, fadeOut: 0.1 },
    ],
  },

  emergency_order: {
    masterVol: 0.55,
    segments: [
      { freq: 880, dur: 0.15, delay: 0, wave: "sawtooth", vol: 0.7, vibrato: 8, vibratoDepth: 40 },
      { freq: 1320, dur: 0.15, delay: 0.15, wave: "sawtooth", vol: 0.7, vibrato: 8, vibratoDepth: 40 },
      { freq: 880, dur: 0.15, delay: 0.30, wave: "sawtooth", vol: 0.7, vibrato: 8, vibratoDepth: 40 },
      { freq: 1320, dur: 0.15, delay: 0.45, wave: "sawtooth", vol: 0.7, vibrato: 8, vibratoDepth: 40 },
      { freq: 880, dur: 0.15, delay: 0.60, wave: "sawtooth", vol: 0.6, vibrato: 8, vibratoDepth: 40 },
      { freq: 1320, dur: 0.2, delay: 0.75, wave: "sawtooth", vol: 0.6, vibrato: 8, vibratoDepth: 40 },
    ],
  },

  order_assigned: {
    masterVol: 0.45,
    segments: [
      { freq: 523, dur: 0.1, delay: 0, wave: "triangle", vol: 0.6 },
      { freq: 659, dur: 0.1, delay: 0.08, wave: "triangle", vol: 0.65 },
      { freq: 784, dur: 0.1, delay: 0.16, wave: "triangle", vol: 0.7 },
      { freq: 1047, dur: 0.2, delay: 0.24, wave: "sine", vol: 0.8, fadeOut: 0.15 },
    ],
  },

  order_update: {
    masterVol: 0.4,
    segments: [
      { freq: 740, dur: 0.1, delay: 0, wave: "triangle", vol: 0.5 },
      { freq: 880, dur: 0.15, delay: 0.12, wave: "sine", vol: 0.6, fadeOut: 0.1 },
    ],
  },

  bid_accepted: {
    masterVol: 0.45,
    segments: [
      { freq: 660, dur: 0.08, delay: 0, wave: "sine", vol: 0.5 },
      { freq: 880, dur: 0.08, delay: 0.06, wave: "sine", vol: 0.6 },
      { freq: 1100, dur: 0.08, delay: 0.12, wave: "sine", vol: 0.7 },
      { freq: 1320, dur: 0.2, delay: 0.18, wave: "triangle", vol: 0.8, fadeOut: 0.15 },
      { freq: 660, dur: 0.2, delay: 0.18, wave: "sine", vol: 0.3, fadeOut: 0.15 },
    ],
  },

  bid_denied: {
    masterVol: 0.4,
    segments: [
      { freq: 400, dur: 0.2, delay: 0, wave: "square", vol: 0.5 },
      { freq: 300, dur: 0.25, delay: 0.2, wave: "square", vol: 0.45 },
      { freq: 200, dur: 0.35, delay: 0.4, wave: "square", vol: 0.4, fadeOut: 0.2 },
    ],
  },

  bid_rejected: {
    masterVol: 0.4,
    segments: [
      { freq: 400, dur: 0.2, delay: 0, wave: "square", vol: 0.5 },
      { freq: 300, dur: 0.25, delay: 0.2, wave: "square", vol: 0.45 },
      { freq: 200, dur: 0.35, delay: 0.4, wave: "square", vol: 0.4, fadeOut: 0.2 },
    ],
  },

  strike: {
    masterVol: 0.45,
    segments: [
      { freq: 200, dur: 0.4, delay: 0, wave: "sawtooth", vol: 0.6, vibrato: 6, vibratoDepth: 15 },
      { freq: 150, dur: 0.5, delay: 0.3, wave: "square", vol: 0.4, fadeOut: 0.3 },
      { freq: 100, dur: 0.4, delay: 0.6, wave: "sawtooth", vol: 0.3, fadeOut: 0.25 },
      { freq: 80, dur: 0.05, delay: 0, wave: "noise", vol: 0.3 },
      { freq: 80, dur: 0.05, delay: 0.3, wave: "noise", vol: 0.25 },
    ],
  },

  payout: {
    masterVol: 0.45,
    segments: [
      { freq: 2200, dur: 0.04, delay: 0, wave: "sine", vol: 0.5 },
      { freq: 2600, dur: 0.04, delay: 0.03, wave: "sine", vol: 0.6 },
      { freq: 3200, dur: 0.06, delay: 0.06, wave: "sine", vol: 0.7 },
      { freq: 3800, dur: 0.04, delay: 0.1, wave: "sine", vol: 0.5 },
      { freq: 2000, dur: 0.03, delay: 0.12, wave: "noise", vol: 0.3 },
      { freq: 3200, dur: 0.15, delay: 0.15, wave: "triangle", vol: 0.6, fadeOut: 0.12 },
      { freq: 1600, dur: 0.15, delay: 0.15, wave: "sine", vol: 0.3, fadeOut: 0.12 },
    ],
  },

  order_income: {
    masterVol: 0.45,
    segments: [
      { freq: 2200, dur: 0.04, delay: 0, wave: "sine", vol: 0.5 },
      { freq: 2600, dur: 0.04, delay: 0.03, wave: "sine", vol: 0.6 },
      { freq: 3200, dur: 0.06, delay: 0.06, wave: "sine", vol: 0.7 },
      { freq: 3800, dur: 0.04, delay: 0.1, wave: "sine", vol: 0.5 },
      { freq: 2000, dur: 0.03, delay: 0.12, wave: "noise", vol: 0.3 },
      { freq: 3200, dur: 0.15, delay: 0.15, wave: "triangle", vol: 0.6, fadeOut: 0.12 },
      { freq: 1600, dur: 0.15, delay: 0.15, wave: "sine", vol: 0.3, fadeOut: 0.12 },
    ],
  },

  alert: {
    masterVol: 0.45,
    segments: [
      { freq: 900, dur: 0.12, delay: 0, wave: "square", vol: 0.5 },
      { freq: 900, dur: 0.12, delay: 0.2, wave: "square", vol: 0.5 },
      { freq: 900, dur: 0.12, delay: 0.4, wave: "square", vol: 0.5 },
      { freq: 700, dur: 0.08, delay: 0.08, wave: "sine", vol: 0.3 },
      { freq: 700, dur: 0.08, delay: 0.28, wave: "sine", vol: 0.3 },
    ],
  },

  message: {
    masterVol: 0.35,
    segments: [
      { freq: 800, dur: 0.06, delay: 0, wave: "sine", vol: 0.4 },
      { freq: 1000, dur: 0.08, delay: 0.05, wave: "sine", vol: 0.5, fadeOut: 0.06 },
      { freq: 500, dur: 0.06, delay: 0, wave: "triangle", vol: 0.2 },
    ],
  },

  chat: {
    masterVol: 0.35,
    segments: [
      { freq: 800, dur: 0.06, delay: 0, wave: "sine", vol: 0.4 },
      { freq: 1000, dur: 0.08, delay: 0.05, wave: "sine", vol: 0.5, fadeOut: 0.06 },
      { freq: 500, dur: 0.06, delay: 0, wave: "triangle", vol: 0.2 },
    ],
  },

  info: {
    masterVol: 0.3,
    segments: [
      { freq: 600, dur: 0.15, delay: 0, wave: "sine", vol: 0.5, fadeOut: 0.12 },
      { freq: 300, dur: 0.15, delay: 0, wave: "triangle", vol: 0.2, fadeOut: 0.12 },
    ],
  },
};

const wavCache: Record<string, string> = {};

function getWavUrl(type: string): string {
  if (wavCache[type]) return wavCache[type];
  const def = soundDefs[type] || soundDefs.info;
  const url = generateAdvancedWav(def.segments, def.masterVol);
  wavCache[type] = url;
  return url;
}

function createPooledAudio(): HTMLAudioElement {
  const audio = new Audio();
  audio.volume = globalVolume;
  audio.src = silentWav();
  return audio;
}

export function unlockMobileAudio(): void {
  try {
    if (audioPool.length === 0) {
      for (let i = 0; i < 3; i++) {
        audioPool.push(createPooledAudio());
      }
    }

    const promises: Promise<void>[] = [];
    for (const audio of audioPool) {
      audio.src = silentWav();
      audio.currentTime = 0;
      const p = audio.play();
      if (p) promises.push(p);
    }

    if (promises.length > 0) {
      Promise.all(promises).then(() => { isUnlocked = true; }).catch(() => {});
    } else {
      isUnlocked = true;
    }
  } catch {}
}

if (typeof window !== "undefined") {
  const gestureEvents = ["touchstart", "touchend", "click", "keydown"];
  const gestureHandler = () => {
    unlockMobileAudio();
    gestureEvents.forEach(e => document.removeEventListener(e, gestureHandler, true));
  };
  gestureEvents.forEach(e => document.addEventListener(e, gestureHandler, { once: true, capture: true }));
}

function getAvailableAudio(): HTMLAudioElement {
  if (audioPool.length === 0) {
    for (let i = 0; i < 3; i++) {
      audioPool.push(createPooledAudio());
    }
  }

  for (const audio of audioPool) {
    if (audio.paused || audio.ended) {
      return audio;
    }
  }

  const fresh = createPooledAudio();
  audioPool.push(fresh);
  if (audioPool.length > 6) {
    audioPool.shift();
  }
  return fresh;
}

export function playNotificationSound(type: string) {
  const wavUrl = getWavUrl(type);

  try {
    const audio = getAvailableAudio();
    audio.volume = globalVolume;
    audio.src = wavUrl;
    audio.currentTime = 0;
    const p = audio.play();
    if (p) {
      p.catch(() => {
        tryFreshAudio(wavUrl);
      });
    }
  } catch {
    tryFreshAudio(wavUrl);
  }
}

function tryFreshAudio(wavUrl: string) {
  try {
    const fresh = new Audio(wavUrl);
    fresh.volume = globalVolume;
    const p = fresh.play();
    if (p) p.catch(() => {});
  } catch {}
}

export function isAudioUnlocked(): boolean {
  return isUnlocked;
}
