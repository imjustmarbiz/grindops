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

function playNewOrderSound() {
  playTone(880, 0.15, "sine", 0.25, 0);
  playTone(1108.73, 0.15, "sine", 0.25, 0.12);
  playTone(1318.51, 0.25, "sine", 0.3, 0.24);
}

function playStrikeSound() {
  playTone(330, 0.3, "square", 0.15, 0);
  playTone(277.18, 0.3, "square", 0.15, 0.25);
  playTone(220, 0.5, "square", 0.2, 0.5);
}

function playPayoutSound() {
  playTone(523.25, 0.12, "sine", 0.2, 0);
  playTone(659.25, 0.12, "sine", 0.2, 0.1);
  playTone(783.99, 0.12, "sine", 0.2, 0.2);
  playTone(1046.5, 0.2, "sine", 0.25, 0.3);
}

function playAlertSound() {
  playTone(800, 0.15, "triangle", 0.25, 0);
  playTone(600, 0.15, "triangle", 0.25, 0.18);
  playTone(800, 0.2, "triangle", 0.25, 0.36);
}

function playMessageSound() {
  playTone(660, 0.1, "sine", 0.2, 0);
  playTone(880, 0.15, "sine", 0.22, 0.08);
}

function playInfoSound() {
  playTone(587.33, 0.12, "sine", 0.2, 0);
  playTone(784, 0.18, "sine", 0.22, 0.1);
}

const soundMap: Record<string, () => void> = {
  new_order: playNewOrderSound,
  strike: playStrikeSound,
  payout: playPayoutSound,
  alert: playAlertSound,
  message: playMessageSound,
  chat: playMessageSound,
  info: playInfoSound,
};

export function playNotificationSound(type: string) {
  try {
    if (audioContext?.state === "suspended") {
      audioContext.resume();
    }
    const playFn = soundMap[type] || playInfoSound;
    playFn();
  } catch (err) {
    // silently fail if audio not supported
  }
}
