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

function generateWav(frequencies: number[], durations: number[], delays: number[], volume: number = 0.4): string {
  let totalLength = 0;
  for (let i = 0; i < frequencies.length; i++) {
    totalLength = Math.max(totalLength, delays[i] + durations[i]);
  }
  const numSamples = Math.ceil(SAMPLE_RATE * (totalLength + 0.05));
  const buffer = new Float32Array(numSamples);

  for (let i = 0; i < frequencies.length; i++) {
    const startSample = Math.floor(SAMPLE_RATE * delays[i]);
    const durSamples = Math.floor(SAMPLE_RATE * durations[i]);
    for (let s = 0; s < durSamples && (startSample + s) < numSamples; s++) {
      const t = s / SAMPLE_RATE;
      const envelope = Math.max(0, 1 - (t / durations[i]) * 1.5);
      buffer[startSample + s] += Math.sin(2 * Math.PI * frequencies[i] * t) * volume * envelope;
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
  return generateWav([0], [0.01], [0], 0);
}

const soundDefs: Record<string, { freqs: number[]; durs: number[]; delays: number[]; vol: number }> = {
  new_order: { freqs: [880, 1108.73, 1318.51], durs: [0.15, 0.15, 0.25], delays: [0, 0.12, 0.24], vol: 0.45 },
  bid_accepted: { freqs: [523.25, 659.25, 783.99, 1046.5, 1318.51], durs: [0.1, 0.1, 0.1, 0.12, 0.25], delays: [0, 0.08, 0.16, 0.24, 0.34], vol: 0.5 },
  bid_denied: { freqs: [440, 349.23, 293.66], durs: [0.2, 0.2, 0.35], delays: [0, 0.18, 0.36], vol: 0.4 },
  bid_rejected: { freqs: [440, 349.23, 293.66], durs: [0.2, 0.2, 0.35], delays: [0, 0.18, 0.36], vol: 0.4 },
  strike: { freqs: [330, 277.18, 220], durs: [0.3, 0.3, 0.5], delays: [0, 0.25, 0.5], vol: 0.35 },
  payout: { freqs: [523.25, 659.25, 783.99, 1046.5], durs: [0.12, 0.12, 0.12, 0.2], delays: [0, 0.1, 0.2, 0.3], vol: 0.4 },
  alert: { freqs: [800, 600, 800], durs: [0.15, 0.15, 0.2], delays: [0, 0.18, 0.36], vol: 0.4 },
  message: { freqs: [660, 880], durs: [0.1, 0.15], delays: [0, 0.08], vol: 0.35 },
  chat: { freqs: [660, 880], durs: [0.1, 0.15], delays: [0, 0.08], vol: 0.35 },
  info: { freqs: [587.33, 784], durs: [0.12, 0.18], delays: [0, 0.1], vol: 0.35 },
};

const wavCache: Record<string, string> = {};

function getWavUrl(type: string): string {
  if (wavCache[type]) return wavCache[type];
  const def = soundDefs[type] || soundDefs.info;
  const url = generateWav(def.freqs, def.durs, def.delays, def.vol);
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
