/**
 * Tiny synthesized sound effects using the Web Audio API.
 * No audio files: every sound is built from oscillators and noise.
 */
export type SoundName =
  | 'dice' | 'buy' | 'pay' | 'gain' | 'card' | 'jail' | 'build' | 'bankrupt' | 'win' | 'debt' | 'trade' | 'turn';

let ctx: AudioContext | null = null;

function audio(): AudioContext {
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new Ctor();
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tone(freq: number, at: number, dur: number, type: OscillatorType = 'sine', vol = 0.12, slideTo?: number) {
  const ac = audio();
  const t = ac.currentTime + at;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(vol, t + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain).connect(ac.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

function noise(at: number, dur: number, vol = 0.12, freq = 2500) {
  const ac = audio();
  const t = ac.currentTime + at;
  const buffer = ac.createBuffer(1, Math.ceil(ac.sampleRate * dur), ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const src = ac.createBufferSource();
  src.buffer = buffer;
  const filter = ac.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = freq;
  const gain = ac.createGain();
  gain.gain.value = vol;
  src.connect(filter).connect(gain).connect(ac.destination);
  src.start(t);
}

const SOUNDS: Record<SoundName, () => void> = {
  dice: () => [0, 0.09, 0.19, 0.3, 0.43, 0.58].forEach((at, i) => noise(at, 0.05, 0.25, 1800 + i * 250)),
  buy: () => { tone(523, 0, 0.12, 'triangle'); tone(784, 0.1, 0.22, 'triangle'); },
  pay: () => { tone(440, 0, 0.14, 'triangle'); tone(330, 0.12, 0.24, 'triangle'); },
  gain: () => { tone(988, 0, 0.08, 'sine', 0.1); tone(1319, 0.07, 0.25, 'sine', 0.1); },
  card: () => { noise(0, 0.18, 0.08, 4000); tone(660, 0.08, 0.12, 'sine', 0.08); tone(880, 0.16, 0.2, 'sine', 0.08); },
  jail: () => [0, 0.16, 0.32].forEach((at) => tone(140, at, 0.12, 'square', 0.07)),
  build: () => { noise(0, 0.06, 0.2, 600); tone(262, 0.02, 0.12, 'triangle'); tone(392, 0.1, 0.16, 'triangle'); },
  bankrupt: () => tone(420, 0, 0.9, 'sawtooth', 0.06, 90),
  win: () => {
    [523, 659, 784].forEach((f, i) => tone(f, i * 0.13, 0.18, 'triangle'));
    [523, 659, 784, 1047].forEach((f) => tone(f, 0.42, 0.7, 'triangle', 0.07));
  },
  debt: () => { tone(600, 0, 0.14, 'square', 0.06); tone(450, 0.16, 0.2, 'square', 0.06); },
  turn: () => { tone(784, 0, 0.12, 'sine', 0.12); tone(1047, 0.12, 0.3, 'sine', 0.12); },
  trade: () => { tone(587, 0, 0.1, 'sine'); tone(740, 0.09, 0.1, 'sine'); tone(880, 0.18, 0.2, 'sine'); },
};

export function playSound(name: SoundName, muted: boolean): void {
  if (muted || typeof window === 'undefined') return;
  try {
    SOUNDS[name]();
  } catch {
    // Audio unavailable (e.g. blocked by the browser): play silently.
  }
}

/** Log keys → sound, in priority order (the first match among new events wins). */
const LOG_SOUNDS: [SoundName, string[]][] = [
  ['win', ['winner', 'winnerByOwnership', 'winnerByTurnLimit']],
  ['bankrupt', ['bankrupt']],
  ['jail', ['wentToJail']],
  ['debt', ['inDebt']],
  ['card', ['drewCard']],
  ['trade', ['tradeAccepted']],
  ['buy', ['bought']],
  ['build', ['builtHouse', 'builtHotel']],
  ['pay', ['paidRent', 'paidTax', 'cardPay', 'jailPaidFine', 'jailForcedFine', 'logUnmortgaged', 'debtPaid', 'paidTo']],
  ['gain', ['passedStart', 'cardGain', 'logMortgaged', 'soldBuilding', 'gotJailCard']],
];

export function soundForLogKeys(keys: string[]): SoundName | null {
  for (const [sound, matches] of LOG_SOUNDS) {
    if (matches.some((k) => keys.includes(k))) return sound;
  }
  return null;
}
